import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SharedComponentsModule } from 'src/app/components/sharedcomponents.module';
import { CoinAddERC20Page } from './coin-add-erc20.page';

@NgModule({
    declarations: [CoinAddERC20Page],
    imports: [
        SharedComponentsModule,
        CommonModule,
        TranslateModule,
        RouterModule.forChild([{ path: '', component: CoinAddERC20Page }])
    ],
    exports: [RouterModule]
})
export class CoinAddERC20Module {}