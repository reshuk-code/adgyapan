import dbConnect from '@/lib/db';
import AdMarketplace from '@/models/AdMarketplace';
import Ad from '@/models/Ad';
import Bid from '@/models/Bid';
import Subscription from '@/models/Subscription';
import Profile from '@/models/Profile';
import WalletTransaction from '@/models/WalletTransaction';
import { sendMarketplaceNotification } from '@/lib/notifications';
import { getAuth } from '@clerk/nextjs/server';
import crypto from 'crypto';
import mongoose from 'mongoose';

export default async function handler(req, res) {
    await dbConnect();
    const { userId } = getAuth(req);

    const session = await mongoose.startSession();

    try {
        if (req.method === 'POST') {
            await session.withTransaction(async () => {
                if (!userId) {
                    throw new Error('Unauthorized');
                }

                // KYC & PRO GATING
                const profile = await Profile.findOne({ userId }).session(session);
                const sub = await Subscription.findOne({ userId }).session(session);

                if (!profile || profile.kycStatus !== 'approved') {
                    throw new Error('KYC Verification Required. Please enroll in the marketplace first! 🛡️');
                }

                const isPremium = sub && sub.status === 'active' && (sub.plan === 'pro' || sub.plan === 'enterprise');
                if (!isPremium) {
                    throw new Error('Bidding is a Pro-exclusive feature. Upgrade to participate! 🚀');
                }

                const { listingId, amount } = req.body;
                if (!listingId || !amount) {
                    throw new Error('Missing listingId or amount');
                }

                // Wallet Check
                if (profile.walletBalance < amount) {
                    throw new Error(`Insufficient balance. Your wallet has Rs ${profile.walletBalance}.`);
                }

                const listing = await AdMarketplace.findById(listingId).session(session);
                if (!listing || listing.status !== 'open') {
                    throw new Error('Listing not available');
                }

                if (listing.expiryDate && new Date(listing.expiryDate) < new Date()) {
                    throw new Error('This listing has expired');
                }

                if (listing.sellerId === userId) {
                    throw new Error('You cannot bid on your own listing');
                }

                if (amount <= listing.currentHighestBid || amount <= listing.basePrice) {
                    throw new Error('Bid must be higher than current highest bid and base price');
                }

                // --- ATOMIC FINANCIAL TRANSACTION ---

                // 1. Deduct from current bidder
                profile.walletBalance -= amount;
                await profile.save({ session });

                // Log Transaction: Bid Deduction
                await WalletTransaction.create([{
                    userId: userId,
                    type: 'bid_deduction',
                    amount: amount,
                    status: 'completed',
                    metadata: { listingId, notes: 'Bid placed' }
                }], { session });

                // 2. Refund the previous highest bidder if they exist
                const previousBid = await Bid.findOne({ listingId, status: 'active' }).session(session);
                if (previousBid) {
                    const prevBidder = await Profile.findOne({ userId: previousBid.bidderId }).session(session);
                    prevBidder.walletBalance += previousBid.amount;
                    await prevBidder.save({ session });

                    // Log Transaction: Refund
                    await WalletTransaction.create([{
                        userId: previousBid.bidderId,
                        type: 'bid_refund',
                        amount: previousBid.amount,
                        status: 'completed',
                        metadata: { listingId, bidId: previousBid._id, notes: 'Outbid refund' }
                    }], { session });

                    previousBid.status = 'outbid';
                    previousBid.escrowStatus = 'refunded';
                    await previousBid.save({ session });

                    // Notify Outbid User (Side effect - do outside transaction if possible, but keeping inside for simplicity of flow, blindly await)
                    // Note: sending notification is external side effect, usually shouldn't block transaction commit, but we'll await it for now.
                    // Ideally, emit event after commit.
                }

                // 3. Create new bid
                const bid = await Bid.create([{
                    listingId,
                    bidderId: userId,
                    amount,
                    status: 'active',
                    escrowStatus: 'held'
                }], { session });

                // 4. Update listing
                listing.currentHighestBid = amount;
                await listing.save({ session });

                // 5. Notify Seller
                await sendMarketplaceNotification(listing.sellerId, {
                    actor: {
                        id: userId,
                        name: profile.legalName || 'A bidder',
                        avatar: profile.avatarUrl,
                        isPro: isPremium
                    },
                    type: 'bid_received',
                    amount,
                    listingTitle: listing.adId?.title || 'Your Listing',
                    entityId: listingId
                });

                // 6. Notify Previous Bidder (Outbid)
                if (previousBid) {
                    await sendMarketplaceNotification(previousBid.bidderId, {
                        actor: { id: 'system', name: 'Marketplace', avatar: '/icon-192x192.png' },
                        type: 'outbid',
                        listingTitle: listing.adId?.title || 'Ad Listing',
                        entityId: listingId
                    });
                }
            });

            // Re-fetch to return clean data or just notify success
            // Since we're inside transaction scope above, we can't easily return from within callback
            // But withTransaction returns the result of the callback if we returned something.
            // Let's just return success outside.
            return res.status(201).json({ success: true, message: 'Bid placed successfully' });
        }

        if (req.method === 'PUT') {
            let resultData;
            await session.withTransaction(async () => {
                if (!userId) throw new Error('Unauthorized');

                const { bidId } = req.body;
                if (!bidId) throw new Error('Missing bidId');

                const bid = await Bid.findById(bidId).populate('listingId').session(session);
                if (!bid) throw new Error('Bid not found');

                if (bid.listingId.sellerId !== userId) throw new Error('Only the seller can accept a bid');
                if (bid.listingId.status !== 'open') throw new Error('Listing is no longer open');

                // Generate API Key
                const apiKey = crypto.randomBytes(16).toString('hex');
                const pin = Math.floor(1000 + Math.random() * 9000).toString();

                // Update Listing
                bid.listingId.status = 'sold';
                bid.listingId.winnerId = bid.bidderId;
                bid.listingId.apiKey = apiKey;
                bid.listingId.pin = pin;
                await bid.listingId.save({ session });

                // Update Bid
                bid.status = 'accepted';
                // Funds remain 'held'
                await bid.save({ session });

                // Notify Winner
                await sendMarketplaceNotification(bid.bidderId, {
                    actor: { id: userId, name: 'Seller', avatar: '', isPro: true },
                    type: 'bid_accepted',
                    listingTitle: bid.listingId.adId?.title || 'Ad Listing',
                    entityId: bid.listingId._id
                });

                // Refund/Cancel other bids
                const otherBids = await Bid.find({ listingId: bid.listingId._id, _id: { $ne: bid._id }, status: 'active' }).session(session);
                for (const other of otherBids) {
                    const otherProfile = await Profile.findOne({ userId: other.bidderId }).session(session);
                    otherProfile.walletBalance += other.amount;
                    await otherProfile.save({ session });

                    await WalletTransaction.create([{
                        userId: other.bidderId,
                        type: 'bid_refund',
                        amount: other.amount,
                        status: 'completed',
                        metadata: { listingId: bid.listingId._id, bidId: other._id, notes: 'Listing sold to another' }
                    }], { session });

                    other.status = 'withdrawn';
                    other.escrowStatus = 'refunded';
                    await other.save({ session });

                    // Notify Outbid (Sold to another)
                    await sendMarketplaceNotification(other.bidderId, {
                        actor: { id: 'system', name: 'Marketplace', avatar: '' },
                        type: 'outbid', // reused outbid type for simplicity
                        message: `Listing "${bid.listingId.adId?.title}" has been sold to another bidder. Your funds were refunded.`,
                        entityId: bid.listingId._id
                    });
                }

                resultData = { apiKey, pin };
            });

            return res.status(200).json({
                success: true,
                message: 'Bid accepted! Funds are held in escrow.',
                data: resultData
            });
        }

        return res.status(405).json({ success: false, error: 'Method not allowed' });

    } catch (error) {
        console.error('Transaction Aborted:', error);
        return res.status(500).json({ success: false, error: error.message });
    } finally {
        session.endSession();
    }
}
