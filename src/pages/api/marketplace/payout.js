import dbConnect from '@/lib/db';
import AdMarketplace from '@/models/AdMarketplace';
import Bid from '@/models/Bid';
import Profile from '@/models/Profile';
import WalletTransaction from '@/models/WalletTransaction';
import { getAuth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    await dbConnect();
    const { userId } = getAuth(req);
    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            if (!userId) throw new Error('Unauthorized');

            const { listingId } = req.body;
            if (!listingId) throw new Error('Missing listingId');

            // 1. Fetch listing and check ownership
            const listing = await AdMarketplace.findById(listingId).session(session);
            if (!listing) throw new Error('Listing not found');
            if (listing.sellerId !== userId) throw new Error('Unauthorized: Only seller can request payout');
            if (listing.status !== 'sold') throw new Error('Listing is not sold yet');

            // 2. Fetch winning bid
            const bid = await Bid.findOne({ listingId, status: 'accepted' }).session(session);
            if (!bid) throw new Error('Winning bid not found');
            if (bid.escrowStatus === 'released') throw new Error('Funds already released');

            // 3. Process Payout with 15% Platform Fee
            const totalBidAmount = bid.amount;
            const commissionRate = 0.15; // 15%
            const platformFee = totalBidAmount * commissionRate;
            const payoutAmount = totalBidAmount - platformFee;

            // Company Profile (ADGYAPAN_OFFICIAL)
            let companyProfile = await Profile.findOne({ userId: 'ADGYAPAN_OFFICIAL' }).session(session);
            if (!companyProfile) {
                companyProfile = await Profile.create([{ userId: 'ADGYAPAN_OFFICIAL', walletBalance: 0 }], { session });
                companyProfile = companyProfile[0];
            }
            companyProfile.walletBalance += platformFee;
            companyProfile.totalEarned += platformFee;
            await companyProfile.save({ session });

            const sellerProfile = await Profile.findOne({ userId }).session(session);
            sellerProfile.walletBalance += payoutAmount;
            sellerProfile.totalEarned += payoutAmount;
            await sellerProfile.save({ session });

            // 4. Update Bid Status
            bid.escrowStatus = 'released';
            await bid.save({ session });

            // 5. Log Transactions
            // Seller Payout
            await WalletTransaction.create([{
                userId: userId,
                type: 'milestone_payout',
                amount: payoutAmount,
                status: 'completed',
                metadata: { listingId, bidId: bid._id, notes: `Payout for "${listing.adId?.title}" (85% share)` }
            }], { session });

            // Platform Fee
            await WalletTransaction.create([{
                userId: 'ADGYAPAN_OFFICIAL',
                type: 'fee',
                amount: platformFee,
                status: 'completed',
                metadata: {
                    listingId,
                    bidId: bid._id,
                    sourceUser: userId,
                    notes: `15% Platform Commission from "${listing.adId?.title}"`
                }
            }], { session });
        });

        // Outside transaction
        return res.status(200).json({ success: true, message: 'Payout processed successfully' });

    } catch (error) {
        console.error('Payout Transaction Failed:', error);
        return res.status(500).json({ success: false, error: error.message });
    } finally {
        session.endSession();
    }
}
