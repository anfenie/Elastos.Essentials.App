import { Logger } from "src/app/logger";
import { GlobalElastosAPIService } from "src/app/services/global.elastosapi.service";
import { StandardCoinName } from "../../../coin";
import { ProviderTransactionInfo } from "../../../providers/providertransactioninfo";
import { SubWalletTransactionProvider } from "../../../providers/subwallet.provider";
import { ElastosTransaction, PaginatedTransactions, TransactionDirection, TransactionStatus } from "../../../providers/transaction.types";
import { AnySubWallet, SubWallet } from "../../subwallet";
import { WalletHelper } from "../wallet.helper";

export class ElastosMainAndOldIDChainSubWalletProvider<SubWalletType extends SubWallet<any>> extends SubWalletTransactionProvider<SubWalletType, ElastosTransaction> {
  private TRANSACTION_LIMIT = 50;
  private needtoLoadMoreAddresses: string[] = [];
  private alreadyTriedToFetchMore = false;
  // Maybe there are lots of transactions and we need to merge the transactions for multi address wallet,
  // for performance we only merge the transactions from timestampStart to timestampEnd.
  private timestampStart = 0;
  private timestampEnd = 0;

  protected getProviderTransactionInfo(transaction: ElastosTransaction): ProviderTransactionInfo {
    return {
      cacheKey: this.subWallet.getTransactionsCacheKey(),
      cacheEntryKey: transaction.txid,
      cacheTimeValue: transaction.time,
      subjectKey: this.subWallet.id
    };
  }

  /**
   * Call this when import a new wallet or get the latest transactions.
   * @param timestamp get the transactions after the timestamp
   * @returns
   */
  public async fetchTransactions(subWallet: AnySubWallet, afterTransaction?: ElastosTransaction): Promise<void> {
    if (afterTransaction) {
      let page = 1;
      let afterTransactionIndex = (await this.getTransactions(subWallet)).findIndex(t => t.txid === afterTransaction.txid);
      if (afterTransactionIndex) { // Just in case, should always be true but...
        // Ex: if tx index in current list of transactions is 18 and we use 8 results per page
        // then the page to fetch is 2: Math.floor(18 / 8) + 1 - API page index starts at 1
        page = 1 + Math.floor((afterTransactionIndex + 1) / this.TRANSACTION_LIMIT);
      }
      await this.fetchMoreMainChainTransactions(page);
    } else {
      // Forcing to fetch from 0, so we reset the canfetchmore flag
      this.alreadyTriedToFetchMore = false;

      let txList = await WalletHelper.getTransactionByAddress(this.subWallet, false, this.TRANSACTION_LIMIT);

      // The Single Address Wallet should use the external address.
      if (!this.subWallet.masterWallet.account.SingleAddress) {
        let txListInternal = await WalletHelper.getTransactionByAddress(this.subWallet, true, this.TRANSACTION_LIMIT);
        if (txListInternal && txListInternal.length > 0) {
          txList = [...txList, ...txListInternal];
        }
      }

      // Get the addresses that need to load more transactions.
      this.needtoLoadMoreAddresses = []
      for (let i = 0, len = txList.length; i < len; i++) {
        if (txList[i].total > this.TRANSACTION_LIMIT) {
          let len = txList[i].transactions.length;
          let timestamp = txList[i].transactions[len - 1].time;
          if (this.timestampStart <= timestamp) {
            this.timestampStart = timestamp;
          }
          // There are lot of transactions in this address.
          this.needtoLoadMoreAddresses.push(txList[i].transactions[0].address)
        }
      }
      // Logger.warn("wallet", 'this.needtoLoadMoreAddresses:', this.needtoLoadMoreAddresses);

      /* if (this.paginatedTransactions == null) {
        // init
        console.log("DEBUG fetchTransactions - setting paginatedTransactions of",this.subWallet.id,"to empty content");
        this.paginatedTransactions.set(this.subWallet.getTransactionsCacheKey(), {
          total: 0,
          transactions: []
        });
      } */

      // console.log("DEBUG MainchainProvider fetchTransactions txList before merge=", txList);

      if (txList.length > 0) {
        await this.mergeTransactionListAndSort(txList);
      } else {
        // Notify the page to show the right time of the transactions even no new transaction.
        // TODO this.subWallet.masterWallet.walletManager.subwalletTransactionStatus.set(this.subwalletTransactionStatusID, this.paginatedTransactions.txhistory.length);
      }
    }
  }

  public canFetchMoreTransactions(subWallet: AnySubWallet): boolean {
    return (!this.alreadyTriedToFetchMore || this.needtoLoadMoreAddresses.length > 0);
  }

  // Call this when load more transactions.
  // TODO: NOT USED CURRENTLY
  //
  async fetchMoreMainChainTransactions(times: number) {
    if (this.needtoLoadMoreAddresses.length === 0) {
      Logger.log('wallet', 'All Transactions are loaded...')
      return;
    }

    this.alreadyTriedToFetchMore = true;

    let skipTxCount = times * this.TRANSACTION_LIMIT;
    let nextLimit = skipTxCount + this.TRANSACTION_LIMIT;
    let txList: PaginatedTransactions<ElastosTransaction>[] = [];
    try {
      const txRawList = await GlobalElastosAPIService.instance.getTransactionsByAddress(this.subWallet.id as StandardCoinName, this.needtoLoadMoreAddresses,
        this.TRANSACTION_LIMIT, skipTxCount, 0);

      this.needtoLoadMoreAddresses = [];
      this.timestampEnd = this.timestampStart;
      this.timestampStart = 0;
      if (txRawList && txRawList.length > 0) {
        for (let i = 0, len = txRawList.length; i < len; i++) {
          txList.push({
            total: txRawList[i].result.totalcount,
            transactions: txRawList[i].result.txhistory
          });
          if (txRawList[i].result.totalcount > nextLimit) {
            let len = txList[i].transactions.length;
            let timestamp = txList[i].transactions[len - 1].time;
            if (this.timestampStart <= timestamp) {
              this.timestampStart = timestamp;
            }
            this.needtoLoadMoreAddresses.push(txRawList[i].result.txhistory[0].address)
          }
        }
        // Logger.log("wallet", 'this.needtoLoadMoreAddresses:', this.needtoLoadMoreAddresses);
      }
    } catch (e) {
      Logger.log("wallet", 'getTransactionByAddress exception:', e);
      throw e;
    }

    if (txList.length > 0) {
      await this.mergeTransactionListAndSort(txList);
    }
  }

  private async mergeTransactionListAndSort(txList: PaginatedTransactions<ElastosTransaction>[]): Promise<void> {
    // When you send transaction, one of the output is the address of this wallet,
    // So we must merge these transactions.
    // For send transactions, every input and output has a transactions.
    // If all the output is the address of this wallet, then this transaction direction is 'MOVED'
    await this.mergeTransactionList(txList);

    // sort by block height
    /* NOT NEEDED ANY MORE - THE CACHE WILL SORT BY TIME VALUE - let transactions = this.getTransactions(this.subWallet).sort(function (t1, t2) {
      // The height is 0 if the transaction is pending.
      if (t2.height === 0) return 1;
      if (t1.height === 0) return -1;
      return t2.height - t1.height;
    }); */

    this.timestampEnd = await this.getLastConfirmedTransactionTimestamp();
  }

  private async getLastConfirmedTransactionTimestamp(): Promise<number> {
    let transactions = await this.getTransactions(this.subWallet);
    for (let i = 0, len = transactions.length; i < len; i++) {
      if (transactions[i].Status === TransactionStatus.CONFIRMED) {
        // the transactions list is sorted by block height.
        return transactions[i].time;
      }
    }
    return 0;
  }

  private async mergeTransactionList(txList: PaginatedTransactions<ElastosTransaction>[]): Promise<void> {
    if (!txList)
      throw new Error("Merge transactions: cannot merge an undefined list");

    //Logger.log('wallet', 'mergeTransactionList start timestamp:', this.timestampStart, txList);
    let transactions: ElastosTransaction[] = [];
    // Get the txhistory after the timestampStart.
    for (let i = 0, len = txList.length; i < len; i++) {
      for (const txhistory of txList[i].transactions) {
        // txhistory.time === 0: pending transaction.
        if ((txhistory.time === 0) || (txhistory.time >= this.timestampStart)) {
          transactions.push(txhistory);
        }
      }
    }

    let allSentTx = transactions.filter((tx) => {
      return tx.type === 'sent'
    })

    let sendtxidArray = [];
    let len = allSentTx.length;
    for (let i = 0; i < len; i++) {
      let isMatch = sendtxidArray.some((tx) => { return tx.txid === allSentTx[i].txid })
      if (!isMatch) {
        sendtxidArray.push({ height: allSentTx[i].height, txid: allSentTx[i].txid });
      }
    }

    //merge and update
    let totalMergeTxCount = 0;
    for (let i = 0, len2 = sendtxidArray.length; i < len2; i++) {
      let txWithSameTxId = transactions.filter((tx) => {
        return tx.txid === sendtxidArray[i].txid;
      })

      let updateInfo = this.mergeTransactionsWithSameTxid(txWithSameTxId);

      let updateArray = false;
      // update the first sent transaction and remove the others.
      for (let j = transactions.length - 1; j >= 0; j--) {
        if ((transactions[j].height == sendtxidArray[i].height)
          && (transactions[j].txid == sendtxidArray[i].txid)) {
          if (!updateArray && (transactions[j].type === 'sent')) {
            transactions[j].value = updateInfo.value;
            transactions[j].type = updateInfo.type as TransactionDirection;
            transactions[j].inputs = updateInfo.inputs;
            transactions[j].outputs = updateInfo.outputs;
            updateArray = true;
          } else {
            transactions.splice(j, 1);
            totalMergeTxCount++;
          }
        }
      }
    }

    /* let paginatedTransactions = this.getPaginatedTransactions(this.subWallet.id);
    for (let i = 0, len = transactions.length; i < len; i++) {
      let existingIndex = paginatedTransactions.transactions.findIndex(tx => tx.txid == transactions[i].txid);
      if (existingIndex === -1) {
        paginatedTransactions.transactions.push(transactions[i]);
      } else {
        // update
        paginatedTransactions.transactions[existingIndex] = transactions[i];
      }
    } */

    await this.saveTransactions(transactions);
  }

  /**
   *
   * @param transactionsArray
   */
  private mergeTransactionsWithSameTxid(transactionsArray) {
    // update value, inputs, type
    let sendTx = [], recvTx = [], sentInputs = [], sentOutputs = [], recvAddress = [];
    let isMoveTransaction = true;
    let sentValue = 0, recvValue = 0;

    if (transactionsArray.length == 1) {
      isMoveTransaction = true;
      // If all the outputs address belong to this wallet, then this transactions is move transaction.
      for (let i = 0; i < transactionsArray[0].outputs.length; i++) {
        if (transactionsArray[0].inputs.indexOf(transactionsArray[0].outputs[i]) < 0) {
          isMoveTransaction = false;
          break;
        }
      }

      let value, type = 'sent';
      if (isMoveTransaction) {
        value = '0', type = 'moved';
      } else {
        value = transactionsArray[0].value;
      }

      return { value, type, inputs: transactionsArray[0].inputs, outputs: transactionsArray[0].outputs }
    }

    for (let i = 0, len = transactionsArray.length; i < len; i++) {
      if (transactionsArray[i].type === 'sent') {
        sendTx.push(transactionsArray[i]);
      } else {
        recvTx.push(transactionsArray[i]);
      }
    }

    // Move transaction : sent outputs same as the received address.
    for (let i = 0, len = recvTx.length; i < len; i++) {
      recvValue += parseFloat(recvTx[i].value);
      recvAddress.push(recvTx[i].address);
    }

    // update value
    for (let i = 0, len = sendTx.length; i < len; i++) {
      sentValue += parseFloat(sendTx[i].value);
      sentInputs = [...sentInputs, ...sendTx[i].inputs];

      for (let j = 0; j < sendTx[i].outputs.length; j++) {
        if (sentOutputs.indexOf(sendTx[i].outputs[j]) < 0) {
          sentOutputs.push(sendTx[i].outputs[j]);
        }
      }
    }

    // If all the outputs address belong to this wallet, then this transactions is move transaction.
    for (let i = sentOutputs.length - 1; i >= 0; i--) {
      if ((recvAddress.indexOf(sentOutputs[i]) < 0) && (sentInputs.indexOf(sentOutputs[i]) < 0)) {
        isMoveTransaction = false;
      } else {
        // This address belongs to this wallet.
        // sentOutputs.splice(i, 1);
      }
    }

    // TODO: Need to update sent outputs, remove the received address.

    let value, type = 'sent';
    if (isMoveTransaction) {
      value = '0', type = 'moved';
    } else {
      value = (sentValue - recvValue).toFixed(8).toString();
    }

    return { value, type, inputs: sentInputs, outputs: sentOutputs }
  }
}