import dbConnect from '@/lib/db';
import AdMarketplace from '@/models/AdMarketplace';
import Ad from '@/models/Ad';
import Bid from '@/models/Bid';
import Subscription from '@/models/Subscription';
import Profile from '@/models/Profile';
import { getAuth } from '@clerk/nextjs/server';
import crypto from 'crypto';

export default async function handler(req, res) {
    await dbConnect();
    const { userId } = getAuth(req);

    if (req.method === 'POST') {
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        try {
            // KYC & PRO GATING
            const profile = await Profile.findOne({ userId });
            const sub = await Subscription.findOne({ userId });

            if (!profile || profile.kycStatus !== 'approved') {
                return res.status(403).json({
                    success: false,
                    error: 'KYC Verification Required. Please enroll in the marketplace first! 🛡️'
                });
            }

            const isPremium = sub && sub.status === 'active' && (sub.plan === 'pro' || sub.plan === 'enterprise');
            if (!isPremium) {
                return res.status(403).json({
                    success: false,
                    error: 'Bidding is a Pro-exclusive feature. Upgrade to participate! 🚀'
                });
            }

            const { listingId, amount } = req.body;
            if (!listingId || !amount) {
                return res.status(400).json({ success: false, error: 'Missing listingId or amount' });
            }

            // Wallet Check
            if (profile.walletBalance < amount) {
                return res.status(400).json({ success: false, error: `Insufficient balance. Your wallet has Rs ${profile.walletBalance}.` });
            }

            const listing = await AdMarketplace.findById(listingId);
            if (!listing || listing.status !== 'open') {
                return res.status(400).json({ success: false, error: 'Listing not available' });
            }

            if (listing.expiryDate && new Date(listing.expiryDate) < new Date()) {
                return res.status(400).json({ success: false, error: 'This listing has expired' });
            }

            if (listing.sellerId === userId) {
                return res.status(400).json({ success: false, error: 'You cannot bid on your own listing' });
            }

            if (amount <= listing.currentHighestBid || amount <= listing.basePrice) {
                return res.status(400).json({ success: false, error: 'Bid must be higher than current highest bid and base price' });
            }

            // --- ESCROW TRANSACTION ---

            // 1. Refund the previous highest bidder if they exist
            const previousBid = await Bid.findOne({ listingId, status: 'active' });
            if (previousBid) {
                await Profile.findOneAndUpdate(
                    { userId: previousBid.bidderId },
                    { $inc: { walletBalance: previousBid.amount } }
                );
                previousBid.status = 'outbid';
                previousBid.escrowStatus = 'refunded';
                await previousBid.save();
            }

            // 2. Deduct from current bidder
            await Profile.findOneAndUpdate(
                { userId },
                { $inc: { walletBalance: -amount } }
            );

            // 3. Create new bid
            const bid = await Bid.create({
                listingId,
                bidderId: userId,
                amount,
                status: 'active',
                escrowStatus: 'held'
            });

            // 4. Update listing
            listing.currentHighestBid = amount;
            await listing.save();

            return res.status(201).json({ success: true, data: bid });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    if (req.method === 'PUT') {
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        try {
            const { bidId } = req.body;
            if (!bidId) {
                return res.status(400).json({ success: false, error: 'Missing bidId' });
            }

            const bid = await Bid.findById(bidId).populate('listingId');
            if (!bid) {
                return res.status(404).json({ success: false, error: 'Bid not found' });
            }

            if (bid.listingId.sellerId !== userId) {
                return res.status(403).json({ success: false, error: 'Only the seller can accept a bid' });
            }

            if (bid.listingId.status !== 'open') {
                return res.status(400).json({ success: false, error: 'Listing is no longer open' });
            }

            // Generate API Key and PIN
            const apiKey = crypto.randomBytes(16).toString('hex');
            const pin = Math.floor(1000 + Math.random() * 9000).toString();

            // Update listing
            bid.listingId.status = 'sold';
            bid.listingId.winnerId = bid.bidderId;
            bid.listingId.apiKey = apiKey;
            bid.listingId.pin = pin;
            await bid.listingId.save();

            // Update accepted bid status
            bid.status = 'accepted';
            // Funds stay in 'held' until milestone
            await bid.save();

            // Finalize other bids (they should already be outbid/refunded in the POST logic, but safety check)
            await Bid.updateMany(
                { listingId: bid.listingId._id, _id: { $ne: bid._id }, status: 'active' },
                { status: 'withdrawn', escrowStatus: 'refunded' }
            );

            return res.status(200).json({
                success: true,
                message: 'Bid accepted! Funds are held in escrow. Release them once milestones are met.',
                data: { apiKey, pin }
            });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
}
