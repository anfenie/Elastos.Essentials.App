import { Component, OnInit } from '@angular/core';
import { AppTheme, GlobalThemeService } from '../../services/global.theme.service';
import { NavController, PopoverController } from '@ionic/angular';
import { TitlebarmenuitemComponent } from '../titlebarmenuitem/titlebarmenuitem.component';
import { TitleBarTheme, TitleBarSlotItem, TitleBarMenuItem, TitleBarIconSlot, TitleBarIcon, TitleBarNavigationMode, BuiltInIcon } from './titlebar.types';

@Component({
  selector: 'app-titlebar',
  templateUrl: './titlebar.component.html',
  styleUrls: ['./titlebar.component.scss'],
})
export class TitleBarComponent {
  public menu: any = null;

  constructor(
    public themeService: GlobalThemeService,
    private popoverCtrl: PopoverController,
    private navCtrl: NavController
  ) {
    themeService.activeTheme.subscribe((activeTheme) => {
      this.setTitleBarTheme(activeTheme);
    });

    // Set the default navigation mode (used by most apps)
    // TODO @chad
    this.setNavigationMode(TitleBarNavigationMode.BACK)
  }

  public title: string = "";

  public visibile: boolean = true;
  public menuVisible: boolean = false;
  private navigationMode: TitleBarNavigationMode;

  public theme: TitleBarTheme = { backgroundColor: "#FFFFFF", color: "000000" };

  public outerLeftIcon: TitleBarSlotItem = TitleBarComponent.makeDefaultIcon();
  public innerLeftIcon: TitleBarSlotItem = TitleBarComponent.makeDefaultIcon();
  public innerRightIcon: TitleBarSlotItem = TitleBarComponent.makeDefaultIcon();
  public outerRightIcon: TitleBarSlotItem = TitleBarComponent.makeDefaultIcon();

  private itemClickedListeners: ((icon: TitleBarSlotItem | TitleBarMenuItem) => void)[] = [];

  public menuItems: TitleBarMenuItem[] = [];

  private static makeDefaultIcon(): TitleBarSlotItem {
    return {
      visible: false,
      key: null,
      iconPath: null,
      badgeCount: 0 };
  }

  /**
   * Sets the main title bar title information. Pass null to clear the previous title.
   * Apps are responsible for managing this title from their internal screens.
   *
   * @param title Main title to show on the title bar. If title is not provided, the title bar shows the default title (the app name)
   */
  public setTitle(title: string) {
    this.title = title;
  }

  /**
   * Sets the status bar background color.
   *
   * @param hexColor Hex color code with format "#RRGGBB"
   */
  public setTheme(backgroundColor: string, color: string) {
    this.theme.backgroundColor = backgroundColor;
    this.theme.color = color;
  }

  /**
   * Adds a listener to be notified when an icon is clicked. This works for both flat icons
   * (setIcon()) and menu items (setupMenuItems()). Use the icon "key" field to know which
   * icon was clicked.
   *
   * @param onItemClicked Callback called when an item is clicked.
   */
  public addOnItemClickedListener(onItemClicked: (icon: TitleBarSlotItem | TitleBarMenuItem) => void) {
    this.itemClickedListeners.push(onItemClicked);
  }

  /**
   * Remove a listener.
   *
   * @param onItemClicked Callback called when an item is clicked.
   */
  public removeOnItemClickedListener(onItemClicked: (icon: TitleBarSlotItem | TitleBarMenuItem) => void) {
    this.itemClickedListeners.splice(this.itemClickedListeners.indexOf(onItemClicked), 1);
  }

  /**
   * Configures icons displayed on the left or right of the main title.
   *
   * Only some privileged apps can configure the OUTER_LEFT slot. Other slots are accessible to all apps.
   * The OUTER_LEFT icon is visible only in case the navigation icon is hidden. Otherwise, the navigation
   * icon overwrites the OUTER_LEFT icon.
   *
   * @param iconSlot Location to configure.
   * @param icon Icon and action to be used at this slot. Use null to clear any existing configuration.
   */
  public setIcon(iconSlot: TitleBarIconSlot, icon: TitleBarIcon) {
    let actualIconPath: string = icon.iconPath
    if (icon) {
      // Replace built-in icon path placeholders with real picture path
      switch (icon.iconPath) {
        case BuiltInIcon.BACK:
          actualIconPath = !this.themeService.darkMode ? '/assets/components/titlebar/elastos.svg' : '/assets/components/titlebar/darkmode/elastos.svg';
          break;
        /* TODO:
        CLOSE = "close",
        SCAN = "scan",
        ADD = "add",
        DELETE = "delete",
        SETTINGS = "settings",
        HELP = "help",
        HORIZONTAL_MENU = "horizontal_menu",
        VERTICAL_MENU = "vertical_menu",
        EDIT = "edit",
        FAVORITE = "favorite"
        */
       default:
        // Nothing, we'll use the real given path.
      }
    }

    switch (iconSlot) {
      case TitleBarIconSlot.OUTER_LEFT:
        if(icon) {
          this.outerLeftIcon.visible = true;
          this.outerLeftIcon.key = icon.key;
          this.outerLeftIcon.iconPath = actualIconPath;
        } else {
          this.outerLeftIcon.visible = false;
          this.outerLeftIcon.key = null;
          this.outerLeftIcon.iconPath = null;
        }
        break;
      case TitleBarIconSlot.INNER_LEFT:
        if(icon) {
          this.innerLeftIcon.visible = true;
          this.innerLeftIcon.key = icon.key;
          this.innerLeftIcon.iconPath = actualIconPath;
        } else {
          this.innerLeftIcon.visible = false;
          this.innerLeftIcon.key = null;
          this.innerLeftIcon.iconPath = null;
        }
        break;
      case TitleBarIconSlot.INNER_RIGHT:
        if(icon) {
          this.innerRightIcon.visible = true;
          this.innerRightIcon.key = icon.key;
          this.innerRightIcon.iconPath = actualIconPath;
        } else {
          this.innerRightIcon.visible = false;
          this.innerRightIcon.key = null;
          this.innerRightIcon.iconPath = null;
        }
        break;
      case TitleBarIconSlot.OUTER_RIGHT:
        if(icon) {
          this.outerRightIcon.visible = true;
          this.outerRightIcon.key = icon.key;
          this.outerRightIcon.iconPath = actualIconPath;
        } else {
          this.outerRightIcon.visible = false;
          this.outerRightIcon.key = null;
          this.outerRightIcon.iconPath = null;
        }
        break;
    }
  }

  /**
   * Configures the menu popup that is opened when the top right menu icon is touched.
   * This menu popup mixes app-specific items (menuItems) and native system actions.
   * When a menu item is touched, the item click listener is called.
   *
   * In case this menu items is configured, it overwrites any icon configured on the OUTER_RIGHT
   * slot.
   *
   * @param menuItems List of app-specific menu entries @TitleBarMenuItem . Pass null to remove the existing menu.
   */
  public setupMenuItems(menuItems: TitleBarMenuItem[]) {
    this.menuItems = this.menuItems;
  }

  /**
   * Adds a badge marker on the top right of an icon slot. Used for example to shows that some
   * notifications are available, unread messages, etc.
   *
   * @param badgeSlot Location to configure.
   * @param count Number to display as a badge over the icon. A value of 0 hides the badge.
   */
  public setBadgeCount(iconSlot: TitleBarIconSlot, count: number) {
    switch (iconSlot) {
      case TitleBarIconSlot.OUTER_LEFT:
        this.outerLeftIcon.badgeCount = count;
        break;
      case TitleBarIconSlot.INNER_LEFT:
        this.innerLeftIcon.badgeCount = count;
        break;
      case TitleBarIconSlot.INNER_RIGHT:
        this.innerRightIcon.badgeCount = count;
        break;
      case TitleBarIconSlot.OUTER_LEFT:
        this.outerRightIcon.badgeCount = count;
        break;
    }
  }

  /**
   * Toggles the visibility status of both the elastOS internal title bar, and the native system
   * status bar. Hiding both bars makes the application become fullscreen.
   *
   * Note that calling this API requires a user permission in order to safely enter fullscreen mode.
   */
  public setVisibility(visibile: boolean) {
    this.visibile = visibile;
  }

  public setMenuVisibility(visible: boolean) {
    this.menuVisible = visible;
  }

  /**
   * Changes the top left icon appearance and behaviour. See @TitleBarNavigationMode for available
   * navigation modes.
   *
   * @param navigationMode See @TitleBarNavigationMode
   */
  public setNavigationMode(navigationMode: TitleBarNavigationMode) {
    this.navigationMode = navigationMode;

    if (navigationMode == TitleBarNavigationMode.BACK)
      this.setIcon(TitleBarIconSlot.OUTER_LEFT, { key: "back", iconPath: BuiltInIcon.BACK });
    else (navigationMode == TitleBarNavigationMode.CLOSE)
      this.setIcon(TitleBarIconSlot.OUTER_LEFT, { key: "close", iconPath: BuiltInIcon.CLOSE });
  }

  private listenableIconClicked(icon: TitleBarSlotItem | TitleBarMenuItem) {
    // Custom icon, call the icon listener
    this.itemClickedListeners.forEach((listener)=>{
      listener(icon);
    });
  }

  outerLeftIconClicked() {
    if (this.navigationMode == TitleBarNavigationMode.BACK)
      this.navCtrl.back();
    else if (this.navigationMode == TitleBarNavigationMode.CLOSE)
      this.navCtrl.back();
    else {
      this.listenableIconClicked(this.outerLeftIcon);
    }
  }

  innerLeftIconClicked() {
    this.listenableIconClicked(this.innerLeftIcon);
  }

  innerRightIconClicked() {
    this.listenableIconClicked(this.innerRightIcon);
  }

  outerRightIconClicked() {
    this.listenableIconClicked(this.outerRightIcon);
  }

  async openMenu(ev) {
    this.menu = await this.popoverCtrl.create({
      mode: 'ios',
      component: TitlebarmenuitemComponent,
      componentProps: {
      },
      cssClass: !this.themeService.activeTheme.value ? 'options' : 'darkOptions',
      event: ev,
      translucent: false
    });
    this.menu.onWillDismiss().then(() => {
      this.menu = null;
    });
    return await this.menu.present();
  }

  private setTitleBarTheme(theme: AppTheme) {
    if (theme === AppTheme.LIGHT) {
      document.body.classList.remove("dark");
      this.theme.backgroundColor = '#f8f8ff';
      this.theme.color = '#000000'
    } else {
      document.body.classList.add("dark");
      this.theme.backgroundColor = '#191a2f';
      this.theme.color = '#ffffff';
    }
  }
}
