import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { useMemo, useEffect, useState } from "react";

export const WalletConnectProvider = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const network = WalletAdapterNetwork.Devnet; // Change to desired network (Devnet, Mainnet, Testnet)

  const endpoint = useMemo(() => {
    return network === WalletAdapterNetwork.Devnet
      ? "https://wiser-few-tree.solana-devnet.quiknode.pro/da952002e47a627b6539b738fb379518240f8162/"
      : clusterApiUrl(network);
  }, [network]);

  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  // Prevent rendering until mounted (fixes hydration errors)
  if (!mounted) {
    return null; // or a loading indicator
  }

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
