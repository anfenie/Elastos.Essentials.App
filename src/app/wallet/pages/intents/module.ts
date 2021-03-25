import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SharedComponentsModule } from 'src/app/components/sharedcomponents.module';
import { AccessPage } from './access/access.page';
import { CRMemberRegisterPage } from './crmemberregister/crmemberregister.page';
import { CRmembervotePage } from './crmembervote/crmembervote.page';
import { CRProposalVoteAgainstPage } from './crproposalvoteagainst/crproposalvoteagainst.page';
import { DidTransactionPage } from './didtransaction/didtransaction.page';
import { DPoSVotePage } from './dposvote/dposvote.page';
import { EscTransactionPage } from './esctransaction/esctransaction.page';
import { SelectSubwalletPage } from './select-subwallet/select-subwallet.page';
import { WaitForSyncPage } from './waitforsync/waitforsync.page';

@NgModule({
    declarations: [
        AccessPage,
        CRMemberRegisterPage,
        CRmembervotePage,
        CRProposalVoteAgainstPage,
        DidTransactionPage,
        DPoSVotePage,
        EscTransactionPage,
        SelectSubwalletPage,
        WaitForSyncPage
    ],
    imports: [
        SharedComponentsModule,
        CommonModule,
        TranslateModule,
        RouterModule.forChild([
            { path: 'access', component: AccessPage },
            { path: 'didtransaction', component: DidTransactionPage },
            { path: 'esctransaction', component: EscTransactionPage },
            { path: 'crmembervote', component: CRmembervotePage },
            { path: 'dposvote', component: DPoSVotePage },
            { path: 'crmemberregister', component: CRMemberRegisterPage },
            { path: 'crproposalvoteagainst', component: CRProposalVoteAgainstPage },
            { path: 'access', component: AccessPage },
            { path: 'select-subwallet', component: SelectSubwalletPage }
        ])
    ],
    exports: [RouterModule]
})
export class IntentsModule {}