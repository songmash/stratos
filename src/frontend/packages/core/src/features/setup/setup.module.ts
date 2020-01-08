import { NgModule } from '@angular/core';

import { CoreModule } from '../../core/core.module';
import { ThemeService } from '../../core/theme.service';
import { SharedModule } from '../../shared/shared.module';
import { DomainMismatchComponent } from './domain-mismatch/domain-mismatch.component';
import { LocalAccountWizardComponent } from './local-account-wizard/local-account-wizard.component';
import { SetupWelcomeComponent } from './setup-welcome/setup-welcome.component';
import { ConsoleUaaWizardComponent } from './uaa-wizard/console-uaa-wizard.component';
import { UpgradePageComponent } from './upgrade-page/upgrade-page.component';
import { StratosComponentsModule } from '@stratos/shared';


@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    StratosComponentsModule
  ],
  declarations: [
    ConsoleUaaWizardComponent,
    UpgradePageComponent,
    DomainMismatchComponent,
    SetupWelcomeComponent,
    LocalAccountWizardComponent
  ],
  providers: [
    ThemeService
  ]
})
export class SetupModule {

  constructor(themeService: ThemeService) {
    // Initialise the theme service, this ensures things like popups are correctly styled
    themeService.initialize();
  }
}
