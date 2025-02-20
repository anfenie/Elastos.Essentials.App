import { TESTNET_TEMPLATE } from "src/app/services/global.networks.service";
import { MasterWallet } from "../../wallets/masterwallet";
import { NetworkWallet } from "../../wallets/networkwallet";
import { TelosNetworkWallet } from "../../wallets/telos/telos.network.wallet";
import { EVMNetwork } from "../evm.network";
import { TelosAPI, TelosAPIType } from "./telos.api";

export class TelosTestNetNetwork extends EVMNetwork {
  constructor() {
    super(
      "telos",
      "Telos",
      "assets/wallet/networks/telos.png",
      "TLOS",
      "Telos",
      TelosAPI.getApiUrl(TelosAPIType.RPC, TESTNET_TEMPLATE),
      TelosAPI.getApiUrl(TelosAPIType.ACCOUNT_RPC, TESTNET_TEMPLATE),
      TESTNET_TEMPLATE,
      41,
      [
      ]
    );

    this.averageBlocktime = 5 // 2;
  }

  public async createNetworkWallet(masterWallet: MasterWallet, startBackgroundUpdates = true): Promise<NetworkWallet> {
    let wallet = new TelosNetworkWallet(masterWallet, this, this.getMainTokenSymbol(), this.mainTokenFriendlyName);
    await wallet.initialize();
    if (startBackgroundUpdates)
      void wallet.startBackgroundUpdates();
    return wallet;
  }
}