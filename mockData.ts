export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number;
  badge: string;
  salesCount: string;
  location: string;
  image: string;
  tags: string[];
}

export interface Category {
  id: string;
  name: string;
  subcategories: string[];
}

export const CATEGORIES: Category[] = [
  { id: '1', name: 'Electronics & Tech', subcategories: ['Laptops', 'Smartphones', 'Audio', 'Gaming'] },
  { id: '2', name: 'Home & Living', subcategories: ['Office Chairs', 'Desks', 'Lighting', 'Decor'] },
  { id: '3', name: 'Apparel & Wearables', subcategories: ['Watches', 'Backpacks', 'Sneakers', 'Jackets'] },
  { id: '4', name: 'Accessories', subcategories: ['Keyboards', 'Mice', 'Chargers', 'Cables'] },
];

export const PRODUCTS: Product[] = [
  {
    id: 'p1',
    title: 'Pro Ultra Wireless Mechanical Keyboard RGB',
    description: 'A sleek wireless mechanical keyboard with quiet linear switches, customizable RGB backlighting, and long battery life. Perfect for late-night typing and gaming.',
    price: 89.99,
    originalPrice: 129.99,
    badge: 'Hot Seller',
    salesCount: '1.2k+ sold',
    location: 'Shenzhen',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80',
    tags: ['keyboard', 'typing', 'rgb', 'gaming', 'wireless', 'mechanical', 'black', 'desk accessory']
  },
  {
    id: 'p2',
    title: 'Ergonomic Mesh Executive Desk Chair',
    description: 'High-back breathable mesh chair with adjustable lumbar support, 3D armrests, and smooth reclining. Designed for sitting comfortably during long work hours.',
    price: 199.50,
    originalPrice: 299.00,
    badge: 'Taobao Choice',
    salesCount: '850+ sold',
    location: 'Guangzhou',
    image: 'https://images.unsplash.com/photo-1580481072645-022f9a6d1270?w=500&q=80',
    tags: ['chair', 'ergonomic', 'office', 'comfort', 'sitting', 'desk', 'mesh', 'back pain', 'furniture']
  },
  {
    id: 'p3',
    title: 'Active Noise Cancelling Over-Ear Headphones',
    description: 'Premium wireless headphones featuring hybrid active noise cancellation, deep bass response, memory foam earcups, and 40-hour battery life.',
    price: 149.00,
    originalPrice: 210.00,
    badge: 'Top Rated',
    salesCount: '3.4k+ sold',
    location: 'Hangzhou',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
    tags: ['headphones', 'audio', 'music', 'noise cancelling', 'wireless', 'bluetooth', 'travel', 'sound']
  },
  {
    id: 'p4',
    title: 'Smart Fitness Tracker & Heart Rate Watch',
    description: 'Waterproof smartwatch with AMOLED display, sleep tracking, heart rate monitor, multi-sport tracking, and 14-day battery life.',
    price: 59.90,
    originalPrice: 89.00,
    badge: 'Flash Sale',
    salesCount: '5k+ sold',
    location: 'Beijing',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80',
    tags: ['watch', 'smartwatch', 'fitness', 'health', 'heart rate', 'runner', 'sport', 'wearable']
  },
  {
    id: 'p5',
    title: 'Minimalist Ultra-Slim 15.6" Tech Backpack',
    description: 'Water-resistant daily commuter backpack with hidden anti-theft pockets, USB charging port, and padded compartment for 15-inch laptops.',
    price: 45.00,
    originalPrice: 65.00,
    badge: 'Direct Factory',
    salesCount: '2.1k+ sold',
    location: 'Shanghai',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80',
    tags: ['backpack', 'bag', 'laptop', 'travel', 'commuter', 'waterproof', 'black', 'school', 'minimalist']
  }
];
