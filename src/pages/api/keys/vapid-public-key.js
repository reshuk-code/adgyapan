export default function handler(req, res) {
    res.status(200).json({ publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BPqD82kfQ-_rYYsUyGvM5pnDBc9EavU1ULNK49ayg3MUjUT6ggxnUEnqvgfB73uT0sXxb6YkfPhqbyjRDc6DJSQ" });
}
