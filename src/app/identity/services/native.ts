
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { isString } from 'lodash';
import { Logger } from 'src/app/logger';
import { GlobalNativeService } from 'src/app/services/global.native.service';
import { GlobalNavService, App } from 'src/app/services/global.nav.service';

@Injectable({
    providedIn: 'root'
})
export class Native {
  private mnemonicLang: DIDPlugin.MnemonicLanguage = "ENGLISH";
  private loader: any = null;

  constructor(
      private translate: TranslateService,
      private native: GlobalNativeService,
      private nav: GlobalNavService
  ) {
  }

  public log(message: any, type: string): void {
    // if (Config.isDebug) {
      let msg = type +  ": " + (isString(message) ? message : JSON.stringify(message));
      Logger.log('Identity', msg);
    // }
  }

  public info(message) {
      this.log(message, "Info");
  }

  public error(message) {
      this.log(message, "Error");
  }

  public warnning(message) {
      this.log(message, "Warnning");
  }

  public toast(msg: string = '操作完成', duration: number = 2000): void {
      this.native.genericToast(msg, duration);
  }

  public toast_trans(msg: string = '', duration: number = 2000): void {
      let message = this.translate.instant(msg);
      this.native.genericToast(msg, duration);
  }

  copyClipboard(text) {
      return this.native.copyClipboard(text);
  }

  // Sensitive data should not be passed through queryParams
  public async go(page: any, options: any = {}) {
    Logger.log('Identity', "NAV - Going to " + page);
    await this.hideLoading();
    this.nav.navigateTo(App.IDENTITY, page, { state: options });
  }

  public pop() {
      this.nav.navigateBack();
  }

  public async setRootRouter(page: any,  options: any = {}) {
    Logger.log('Identity', "NAV - Setting root to " + page);
    await this.hideLoading();
    this.nav.navigateRoot(App.IDENTITY, page, { state: options });
  }

  public getMnemonicLang(): DIDPlugin.MnemonicLanguage {
      return this.mnemonicLang;
  }

  public setMnemonicLang(lang: DIDPlugin.MnemonicLanguage) {
      this.mnemonicLang = lang;
  }

  public clone(Obj) {
      if (typeof (Obj) != 'object') return Obj;
      if (Obj == null) return Obj;

      let newObj;

      if (Obj instanceof (Array)) {
          newObj = new Array();
      } else {
          newObj = new Object();
      }

      for (let i in Obj)
          newObj[i] = this.clone(Obj[i]);

      return newObj;
  }


  public async showLoading(content: string = 'please-wait') {
    await this.native.showLoading(content);
  };

  public async hideLoading() {
    await this.native.hideLoading();
  };

  public getTimestamp() {
      return new Date().getTime().toString();
  }
}


