import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SharedComponentsModule } from 'src/app/components/sharedcomponents.module';
import { CoinErc20DetailsPage } from './coin-erc20-details.page';

@NgModule({
    declarations: [CoinErc20DetailsPage],
    imports: [
        SharedComponentsModule,
        CommonModule,
        TranslateModule,
        RouterModule.forChild([{ path: '', component: CoinErc20DetailsPage }])
    ],
    exports: [RouterModule]
})
export class CoinERC20DetailsModule {}