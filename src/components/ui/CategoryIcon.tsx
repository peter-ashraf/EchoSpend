import { ForkKnife, Car, ShoppingCart, Receipt, Money, DotsThree, FirstAid, House } from '@phosphor-icons/react';

export const availableIcons = ['ForkKnife', 'Car', 'ShoppingCart', 'Receipt', 'Money', 'FirstAid', 'House', 'DotsThree'];

export function CategoryIcon({ name, size = 24 }: { name: string; size?: number }) {
  switch (name) {
    case 'ForkKnife': return <ForkKnife size={size} />;
    case 'Car': return <Car size={size} />;
    case 'ShoppingCart': return <ShoppingCart size={size} />;
    case 'Receipt': return <Receipt size={size} />;
    case 'Money': return <Money size={size} />;
    case 'FirstAid': return <FirstAid size={size} />;
    case 'House': return <House size={size} />;
    default: return <DotsThree size={size} />;
  }
}
