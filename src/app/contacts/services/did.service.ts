import { Injectable } from '@angular/core';
import { Contact } from '../models/contact.model';
import { TranslateService } from '@ngx-translate/core';
import { UxService } from './ux.service';
import { GlobalDIDSessionsService, IdentityEntry } from 'src/app/services/global.didsessions.service';
import { TemporaryAppManagerPlugin } from 'src/app/TMP_STUBS';
import { Logger } from 'src/app/logger';

declare let essentialsIntent: EssentialsIntentPlugin.Intent;

@Injectable({
  providedIn: 'root'
})
export class DidService {
  public signedIdentity: IdentityEntry = null;

  constructor(
    private translate: TranslateService,
    private uxService: UxService,
    private didSessions: GlobalDIDSessionsService,
  ) { }

  getSignedIdentity(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.didSessions.getSignedInIdentity().then((entry: IdentityEntry) => {
        Logger.log("contacts", 'Signed Identity', entry);
        this.signedIdentity = entry;
        resolve(entry.didString);
      });
    });
  }

  async shareIdentity(contact: Contact) {
    essentialsIntent.sendIntent("share", {
      title: this.translate.instant("share-add-me-as-friend"),
      url: await this.uxService.getAddFriendShareableUrl(contact.id, contact.notificationsCarrierAddress),
    });
  }

  async getUserDID(): Promise<string> {
    if (this.signedIdentity) {
      return this.signedIdentity.didString;
    } else {
      return await this.getSignedIdentity();
    }
  }
}
