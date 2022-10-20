import DfinityLogo from '@/assets/dfinity-logo.svg';
import PlugLogo from '@/assets/plug-logo.png';
import { ChainType, WalletType } from '@/wallets';

export const ChainLogos: Record<ChainType, string> = {
  [ChainType.Dfinity]: DfinityLogo,
};

export const WalletLogos: Record<WalletType, string> = {
  [WalletType.Plug]: PlugLogo,
};
