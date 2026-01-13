import dbConnect from '@/lib/db';
import WalletTransaction from '@/models/WalletTransaction';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    await dbConnect();
    const { userId } = getAuth(req);

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const { type, amount, paymentProof, metadata } = req.body;

        if (!type || !amount || !paymentProof) {
            return res.status(400).json({
                success: false,
                error: `Detailed Verification Required: Missing ${!type ? 'Type ' : ''}${!amount ? 'Amount ' : ''}${!paymentProof ? 'Payment Proof' : ''}`
            });
        }

        const transaction = await WalletTransaction.create({
            userId,
            type,
            amount: Number(amount),
            paymentProof,
            status: 'pending',
            metadata: {
                ...metadata,
                source: 'Manual Checkout'
            }
        });

        return res.status(200).json({
            success: true,
            message: 'Transaction submitted for administrative verification.',
            data: transaction
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
