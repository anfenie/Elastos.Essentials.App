import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PopoverController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { Logger } from 'src/app/logger';
import { App } from 'src/app/model/app.enum';
import { Util } from 'src/app/model/util';
import { GlobalNavService } from 'src/app/services/global.nav.service';
import { PopupProvider } from 'src/app/services/global.popup.service';
import { GlobalThemeService } from 'src/app/services/global.theme.service';
import { VoteService } from 'src/app/vote/services/vote.service';
import { Config } from 'src/app/wallet/config/Config';
import { VoteContent, VoteType } from 'src/app/wallet/model/SPVWalletPluginBridge';
import { WalletAccountType } from 'src/app/wallet/model/walletaccount';
import { CandidatesService } from '../../services/candidates.service';

@Component({
    selector: 'app-impeach',
    templateUrl: './impeach.page.html',
    styleUrls: ['./impeach.page.scss'],
})
export class ImpeachCRMemberPage {
    @ViewChild(TitleBarComponent, { static: false }) titleBar: TitleBarComponent;

    public member: any = {};
    public signingAndTransacting = false;
    public maxVotes = 0;
    public amount = 0;

    constructor(
        public theme: GlobalThemeService,
        public translate: TranslateService,
        private popoverCtrl: PopoverController,
        private route: ActivatedRoute,
        private globalNav: GlobalNavService,
        public candidatesService: CandidatesService,
        private voteService: VoteService,
        public popupProvider: PopupProvider,
    ) { }


    ionViewWillEnter() {
        this.titleBar.setTitle(this.translate.instant('crcouncilvoting.impeachment'));
        this.member = this.candidatesService.selectedMember;

        const stakeAmount = this.voteService.sourceSubwallet.getRawBalance().minus(this.votingFees());
        if (!stakeAmount.isNegative()) {
            this.maxVotes = Math.floor(stakeAmount.dividedBy(Config.SELAAsBigNumber).toNumber());
        }
    }

    cancel() {
        void this.globalNav.navigateBack();
    }

    // async voteImpeachCRMember() {
    //     await this.goTransaction();
    // }

    async goTransaction(): Promise<boolean> {
        if (this.voteService.walletInfo.Type === WalletAccountType.MULTI_SIGN) {
            await this.popupProvider.ionicAlert('crcouncilvoting.impeach-council-member', 'crproposalvoting.multi-sign-reject-voting');
            return false;
        }
        // Request the wallet to publish our vote.
        else if (await this.voteService.sourceSubwallet.hasPendingBalance()) {
            await this.popupProvider.ionicAlert('wallet.confirmTitle', 'wallet.transaction-pending');
            return false;
        }
        else if (this.amount > this.maxVotes) {
            await this.popupProvider.ionicAlert('crcouncilvoting.impeach-council-member', 'crproposalvoting.greater-than-max-votes');
            return false;
        }
        else if (this.amount == 0) {
            return false;
        }

        const stakeAmount = Util.accMul(this.amount, Config.SELA);
        await this.createVoteImpeachTransaction(stakeAmount.toString());
        return true;
    }

    /**
     * Fees needed to pay for the vote transaction. They have to be deduced from the total amount otherwise
     * funds won't be enough to vote.
     */
    votingFees(): number {
        return 100000; // SELA: 0.001ELA
    }

    async createVoteImpeachTransaction(voteAmount) {
        this.signingAndTransacting = true;
        Logger.log('wallet', 'Creating vote transaction with amount', voteAmount);

        let votes = {};
        votes[this.member.cid] = voteAmount; // Vote with everything
        Logger.log('wallet', "Vote:", votes);

        let crVoteContent: VoteContent = {
            Type: VoteType.CRCImpeachment,
            Candidates: votes
        }

        const voteContent = [crVoteContent];
        const rawTx = await this.voteService.sourceSubwallet.createVoteTransaction(
            voteContent,
            '', //memo
        );
        Logger.log('wallet', "rawTx:", rawTx);


        try {
            await this.voteService.signAndSendRawTransaction(rawTx, App.CRCOUNCIL_VOTING, "/crcouncilvoting/crmember");
        }
        catch (e) {
            await this.popupProvider.ionicAlert('crcouncilvoting.impeach-council-member', "Sorry, unable to vote. Your crproposal can't be vote for now. ");
        }

        this.signingAndTransacting = false;
    }

}



