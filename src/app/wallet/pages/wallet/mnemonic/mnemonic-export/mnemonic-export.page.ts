import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AppService } from '../../../../services/app.service';
import { AuthService } from '../../../../services/auth.service';
import { Native } from '../../../../services/native.service';
import { Util } from '../../../../model/Util';
import { WalletManager } from '../../../../services/wallet.service';
import { WalletEditionService } from '../../../../services/walletedition.service';
import { TranslateService } from '@ngx-translate/core';
import { IntentTransfer } from '../../../../services/cointransfer.service';
import { WalletAccessService } from '../../../../services/walletaccess.service';
import { Events } from '../../../../services/events.service';
import { GlobalThemeService } from 'src/app/services/global.theme.service';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { TitleBarForegroundMode } from 'src/app/components/titlebar/titlebar.types';
import { GlobalIntentService } from 'src/app/services/global.intent.service';

@Component({
    selector: 'app-mnemonic-export',
    templateUrl: './mnemonic-export.page.html',
    styleUrls: ['./mnemonic-export.page.scss'],
})
export class MnemonicExportPage implements OnInit {
    @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;

    public title = '';
    public payPassword: string = '';
    public masterWalletId: string = "1";
    public mnemonicList = [];
    public hideMnemonic: boolean = true;
    public isFromIntent = false;
    public mnemonicStr: string = "";
    public walletname: string = "";
    public account: any = {};
    public intentTransfer: IntentTransfer;

    constructor(
        public router: Router,
        public walletManager: WalletManager,
        public zone: NgZone,
        private walletEditionService: WalletEditionService,
        private globalIntentService: GlobalIntentService,
        public native: Native,
        public events: Events,
        public appService: AppService,
        private authService: AuthService,
        public theme: GlobalThemeService,
        private translate: TranslateService,
        private walletAccessService: WalletAccessService
    ) {
        this.init();
    }

    ngOnInit() {
        this.appService.setTitleBarTitle(this.translate.instant('wallet-settings-backup-wallet'));
    }

    ionViewWillEnter() {
    }

    init() {
        const navigation = this.router.getCurrentNavigation();
        this.zone.run(() => {
            if (!Util.isEmptyObject(navigation.extras.state)) {
                if (navigation.extras.state.payPassword) {
                    this.masterWalletId = this.walletEditionService.modifiedMasterWalletId;
                    this.payPassword = navigation.extras.state.payPassword;
                    this.showMnemonics();
                } else {
                    console.log('From intent');
                    this.isFromIntent = true;
                    this.intentTransfer = this.walletAccessService.intentTransfer;
                    this.masterWalletId = this.walletAccessService.masterWalletId;
                    this.title = 'access-mnemonic';
                }
            } else {
                this.title = 'text-export-mnemonic';
                this.masterWalletId = this.walletEditionService.modifiedMasterWalletId;
            }

            const masterWallet = this.walletManager.getMasterWallet(this.masterWalletId);
            this.walletname = masterWallet.name;
            this.account = masterWallet.account.Type;
        });
    }

    async getPassword() {
        try {
            this.payPassword = await this.authService.getWalletPassword(this.masterWalletId, true, true);
            if (this.payPassword) {
                return true;
            } else {
                return false;
            }
        } catch (e) {
            console.error('MnemonicExportPage getWalletPassword error:' + e);
            return false;
        }
    }

    async onExport() {
        if (await this.getPassword()) {
           this.showMnemonics();
        } else {
            // User cancel
            console.log('MnemonicExportPage user cancel');
            await this.globalIntentService.sendIntentResponse(
                { txid: null, status: 'cancelled' },
                this.intentTransfer.intentId
            );
        }
    }

    async showMnemonics() {
        const ret = await this.walletManager.spvBridge.exportWalletWithMnemonic(this.masterWalletId, this.payPassword);
        this.titleBar.setBackgroundColor('#6B26C6');
        this.titleBar.setForegroundMode(TitleBarForegroundMode.LIGHT);
        this.appService.setTitleBarTitle(this.translate.instant('mnemonic'));

        this.mnemonicStr = ret.toString();
        let mnemonicArr = this.mnemonicStr.split(/[\u3000\s]+/).filter(str => str.trim().length > 0);

        for (let i = 0; i < mnemonicArr.length; i++) {
            this.mnemonicList.push(mnemonicArr[i]);
        }

        this.hideMnemonic = false;
    }

    async onShare() {
        await this.globalIntentService.sendIntentResponse(
            { mnemonic: this.mnemonicStr },
            this.intentTransfer.intentId
        );
    }

    return() {
        this.native.go("/wallet-settings");
    }
}
