import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { ModalController } from '@ionic/angular';
import * as moment from 'moment';

import { AppTheme, ThemeService } from 'src/app/services/theme.service';
import {
  NotificationManagerService,
  LauncherNotification,
  LauncherNotificationType
} from '../../services/notificationmanager.service';
import { not } from '@angular/compiler/src/output/output_ast';
import { AppmanagerService } from '../../services/appmanager.service';
import { TipsService } from '../../services/tips.service';
import { AppManagerPlugin } from 'src/app/TMP_STUBS';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
})
export class NotificationsPage implements OnInit {

  public notifications = [
  ];

  constructor(
    private sanitizer: DomSanitizer,
    private modalController: ModalController,
    public notificationService: NotificationManagerService,
    public theme: ThemeService,
    public translate: TranslateService,
    public appService: AppmanagerService,
    private tipsService: TipsService,
    private appManager: AppManagerPlugin
  ) {
  }

  ngOnInit() {}

  sanitize(url: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  async start(notification: LauncherNotification) {
    await this.close(notification);

    if (notification.type == LauncherNotificationType.TIP) {
      // Special "tip" notification: handle this directly in the launcher app without starting an intent
      console.log("Opening tip from notification", notification);

      let tipData = JSON.parse(notification.message);
      this.appService.presentTip(this.tipsService.findTipByIdentifier(tipData.key));
    }
    else if (notification.url && (notification.url !== '')) {
      console.log('NotificationsComponent sendUrlIntent');
      this.appManager.sendUrlIntent(notification.url,
        () => {console.log('sendUrlIntent success'); },
        (error) => {console.log('NotificationsComponent sendUrlIntent failed, ', error); }
      );
    } else {
      this.appManager.start(notification.app.id);
    }
  }

  async close(notification: LauncherNotification) {
    this.notificationService.deleteNotification(notification.notificationId);

    if (notification.type == LauncherNotificationType.TIP) {
      // Dismissed tip = mark as viewed to not bother user again with it.
      let tipData = JSON.parse(notification.message);
      let tip = this.tipsService.findTipByIdentifier(tipData.key);
      this.tipsService.markTipAsViewed(tip);
    }

    if (this.notificationService.notifications.length === 0) {
      await this.modalController.dismiss();
    }
  }

  async closeAllNotifications() {
    for (let notification of this.notificationService.notifications) {
      await this.close(notification);
    }
  }

  getNotificationIcon(notification: LauncherNotification) {
    if (notification.type === LauncherNotificationType.SYSTEM) {
      if (this.theme.activeTheme.value == AppTheme.DARK) {
        return "assets/icons/dark_mode/elalogo.svg";
      } else {
        return "assets/icons/elalogo.svg";
      }
    } else if (notification.type === LauncherNotificationType.CONTACT) {
      if (notification.contactAvatar && Object.keys(notification.contactAvatar).length !== 0) {
        return 'data:'+notification.contactAvatar.contentType+';base64,'+notification.contactAvatar.base64ImageData;
      } else {
        return "assets/icons/contact.png";
      }
    } else if (notification.type === LauncherNotificationType.NORMAL) {
      return this.sanitize(notification.app.icons[0].src);
    } else {
      if (this.theme.activeTheme.value == AppTheme.DARK) {
        return "assets/icons/dark_mode/elalogo.svg";
      } else {
        return "assets/icons/elalogo.svg";
      }
    }
  }

  getNotificationHeader(notification: LauncherNotification) {
    // if (notification.app)
    //   console.log("ICON :"+JSON.stringify(notification.app.icons))

    if (notification.type === LauncherNotificationType.CONTACT) {
      if (notification.contactName)
        return notification.contactName;
      else
        return this.translate.instant('from-unknown-contact');
    }
    else if (notification.app && notification.app.name) {
      return notification.app.name;
    }
    else if (notification.type == LauncherNotificationType.TIP) {
      return this.translate.instant('tip-of-the-day');
    }
    else {
      return this.translate.instant('system-notification' ); // Default if no title or if system
    }
  }

  getNotificationTitle(notification: LauncherNotification) {
    return notification.title;
  }

  getNotificationDate(notification: LauncherNotification) {
    return moment(Number(notification.sent_date)).startOf('minutes').fromNow();
  }

  getNotificationMessage(notification: LauncherNotification) {
    if (notification.type == LauncherNotificationType.TIP) {
      let jsonMessage = JSON.parse(notification.message);
      let translatedMessage: string = jsonMessage["message"];

      // Truncate long message - remove html tags
      return translatedMessage.replace(/<\/?[^>]+>/gi, "").substr(0, 100) + "...";
    }
    else {
      return notification.message;
    }
  }
}
