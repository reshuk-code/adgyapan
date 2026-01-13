
import { Utensils, Home, ShoppingBag, Landmark, Camera } from 'lucide-react';

export const INDUSTRY_TEMPLATES = [
    {
        id: 'restaurant',
        name: 'Hospitality & Dining',
        icon: <Utensils size={24} />,
        description: 'Perfect for floating AR menus, daily specials, or kitchen tours.',
        preset: {
            scale: 1,
            rotationX: 0,
            rotationY: 0,
            aspectRatio: 1.77, // 16:9
            opacity: 1
        }
    },
    {
        id: 'realestate',
        name: 'Real Estate & Living',
        icon: <Home size={24} />,
        description: 'Immersive property walkthroughs and 360 virtual tours.',
        preset: {
            scale: 1.2,
            rotationX: 0,
            rotationY: 0,
            aspectRatio: 1.33, // 4:3
            opacity: 0.95
        }
    },
    {
        id: 'retail',
        name: 'Fashion & Retail',
        icon: <ShoppingBag size={24} />,
        description: 'Showcase product features, size guides, or virtual catwalks.',
        preset: {
            scale: 0.8,
            rotationX: 0,
            rotationY: 90,
            aspectRatio: 1, // 1:1
            opacity: 1
        }
    },
    {
        id: 'events',
        name: 'Events & Invites',
        icon: <Landmark size={24} />,
        description: 'Digital RSVPs and animated event posters that pop.',
        preset: {
            scale: 1,
            rotationX: 10,
            rotationY: 0,
            aspectRatio: 1.77,
            opacity: 0.9
        }
    }
];
