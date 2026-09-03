import {
  ForkKnife, Car, ShoppingCart, Receipt, Money, DotsThree, FirstAid, House,
  FilmSlate, Heartbeat, ArrowsLeftRight, Coffee, Airplane, Train, GasPump,
  GraduationCap, GameController, Gift, PawPrint, TShirt, Phone, Lightning,
  Drop, Wrench, Bus, Book, Tag, Wallet, ShieldCheck, Smiley, MusicNote,
  Scissors, Briefcase, Baby, HandCoins, Bicycle, Barbell, Pizza, Pill,
  Ticket, Sparkle, Bank, DeviceMobile, WifiHigh
} from '@phosphor-icons/react';

export const availableIcons = [
  'ForkKnife', 'Pizza', 'Coffee',
  'ShoppingCart', 'Tag', 'TShirt',
  'Car', 'GasPump', 'Bus', 'Train', 'Airplane', 'Bicycle',
  'Receipt', 'Lightning', 'Drop', 'Phone', 'WifiHigh',
  'FilmSlate', 'GameController', 'MusicNote', 'Ticket',
  'Heartbeat', 'FirstAid', 'Pill', 'Barbell',
  'House', 'Wrench', 'PawPrint', 'Baby', 'Scissors',
  'Money', 'Wallet', 'HandCoins', 'Bank',
  'GraduationCap', 'Book', 'Briefcase',
  'Gift', 'Sparkle', 'ShieldCheck', 'Smiley', 'ArrowsLeftRight',
  'DotsThree'
];

export const popularEmojis = [
  '🍔', '🍕', '☕', '🛒', '⛽', '🚗', '✈️', '🎮',
  '🎬', '💊', '🏋️', '💡', '📱', '🐾', '🎓', '🎁',
  '💈', '🏠', '💰', '👶', '📚', '👕', '🏖️', '⚡'
];

export function CategoryIcon({ name, size = 24 }: { name: string; size?: number }) {
  // If the icon name is an emoji (or non-ascii symbol)
  if (!name || /\p{Extended_Pictographic}/u.test(name)) {
    return <span style={{ fontSize: size * 0.9, lineHeight: 1 }}>{name || '🏷️'}</span>;
  }

  switch (name) {
    case 'ForkKnife': return <ForkKnife size={size} />;
    case 'Pizza': return <Pizza size={size} />;
    case 'Coffee': return <Coffee size={size} />;
    case 'ShoppingCart': return <ShoppingCart size={size} />;
    case 'Tag': return <Tag size={size} />;
    case 'TShirt': return <TShirt size={size} />;
    case 'Car': return <Car size={size} />;
    case 'GasPump': return <GasPump size={size} />;
    case 'Bus': return <Bus size={size} />;
    case 'Train': return <Train size={size} />;
    case 'Airplane': return <Airplane size={size} />;
    case 'Bicycle': return <Bicycle size={size} />;
    case 'Receipt': return <Receipt size={size} />;
    case 'Lightning': return <Lightning size={size} />;
    case 'Drop': return <Drop size={size} />;
    case 'Phone': return <Phone size={size} />;
    case 'DeviceMobile': return <DeviceMobile size={size} />;
    case 'WifiHigh': return <WifiHigh size={size} />;
    case 'FilmSlate': return <FilmSlate size={size} />;
    case 'GameController': return <GameController size={size} />;
    case 'MusicNote': return <MusicNote size={size} />;
    case 'Ticket': return <Ticket size={size} />;
    case 'Heartbeat': return <Heartbeat size={size} />;
    case 'FirstAid': return <FirstAid size={size} />;
    case 'Pill': return <Pill size={size} />;
    case 'Barbell': return <Barbell size={size} />;
    case 'House': return <House size={size} />;
    case 'Wrench': return <Wrench size={size} />;
    case 'PawPrint': return <PawPrint size={size} />;
    case 'Baby': return <Baby size={size} />;
    case 'Scissors': return <Scissors size={size} />;
    case 'Money': return <Money size={size} />;
    case 'Wallet': return <Wallet size={size} />;
    case 'HandCoins': return <HandCoins size={size} />;
    case 'Bank': return <Bank size={size} />;
    case 'GraduationCap': return <GraduationCap size={size} />;
    case 'Book': return <Book size={size} />;
    case 'Briefcase': return <Briefcase size={size} />;
    case 'Gift': return <Gift size={size} />;
    case 'Sparkle': return <Sparkle size={size} />;
    case 'ShieldCheck': return <ShieldCheck size={size} />;
    case 'Smiley': return <Smiley size={size} />;
    case 'ArrowsLeftRight': return <ArrowsLeftRight size={size} />;
    case 'DotsThree': return <DotsThree size={size} />;
    default:
      // If it's a short text (1-2 letters), render as clean monogram badge
      if (name.length <= 2) {
        return <span className="font-bold text-xs uppercase" style={{ fontSize: size * 0.6 }}>{name}</span>;
      }
      return <DotsThree size={size} />;
  }
}
