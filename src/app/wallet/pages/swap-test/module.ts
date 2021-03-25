import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SharedComponentsModule } from 'src/app/components/sharedcomponents.module';
import { SwapTestPage } from './swap-test.page';

@NgModule({
    declarations: [SwapTestPage],
    imports: [
        SharedComponentsModule,
        CommonModule,
        TranslateModule,
        RouterModule.forChild([{ path: '', component: SwapTestPage }])
    ],
    exports: [RouterModule]
})
export class SwapTestModule {}