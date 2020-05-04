import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {
  ErrorStateMatcher,
  MatSnackBar,
  MatSnackBarRef,
  ShowOnDirtyErrorStateMatcher,
  SimpleSnackBar,
} from '@angular/material';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, first, map, pairwise, publishReplay, refCount } from 'rxjs/operators';

import { ApplicationService } from '../../../../cloud-foundry/src/features/applications/application.service';
import { safeUnsubscribe } from '../../../../core/src/core/utils.service';
import { ConfirmationDialogConfig } from '../../../../core/src/shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../core/src/shared/components/confirmation-dialog.service';
import { AppState } from '../../../../store/src/app-state';
import { entityCatalog } from '../../../../store/src/entity-catalog/entity-catalog.service';
import { EntityService } from '../../../../store/src/entity-service';
import { EntityServiceFactory } from '../../../../store/src/entity-service-factory.service';
import { ActionState } from '../../../../store/src/reducers/api-request-reducer/types';
import { selectDeletionInfo } from '../../../../store/src/selectors/api.selectors';
import { AutoscalerConstants } from '../../core/autoscaler-helpers/autoscaler-util';
import {
  DeleteAppAutoscalerCredentialAction,
  UpdateAppAutoscalerCredentialAction,
} from '../../store/app-autoscaler.actions';
import { AppAutoscalerCredential } from '../../store/app-autoscaler.types';

@Component({
  selector: 'app-edit-autoscaler-credential',
  templateUrl: './edit-autoscaler-credential.component.html',
  styleUrls: ['./edit-autoscaler-credential.component.scss'],
  providers: [
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher },
  ]
})
export class EditAutoscalerCredentialComponent implements OnInit, OnDestroy {

  parentUrl = `/applications/${this.applicationService.cfGuid}/${this.applicationService.appGuid}/autoscale`;
  applicationName$: Observable<string>;

  public editCredentialForm: FormGroup;
  public randomCredential = true;
  public appAutoscalerCredential$: Observable<AppAutoscalerCredential>;

  private appAutoscalerCredentialErrorSub: Subscription;
  private appAutoscalerCredentialSnackBarRef: MatSnackBarRef<SimpleSnackBar>;

  constructor(
    public applicationService: ApplicationService,
    private fb: FormBuilder,
    private store: Store<AppState>,
    private entityServiceFactory: EntityServiceFactory,
    private appAutoscalerCredentialSnackBar: MatSnackBar,
    private confirmDialog: ConfirmationDialogService,
  ) {
    this.editCredentialForm = this.fb.group({
      acusername: new FormControl({ value: '', disabled: this.randomCredential }, Validators.required),
      acpassword: new FormControl({ value: '', disabled: this.randomCredential }, Validators.required),
    });
  }

  ngOnInit() {
    this.applicationName$ = this.applicationService.app$.pipe(
      map(({ entity }) => entity ? entity.entity.name : null),
      publishReplay(1),
      refCount()
    );
  }

  ngOnDestroy(): void {
    if (this.appAutoscalerCredentialSnackBarRef) {
      this.appAutoscalerCredentialSnackBarRef.dismiss();
    }
    safeUnsubscribe(this.appAutoscalerCredentialErrorSub);
  }

  toggleChange() {
    this.randomCredential = !this.randomCredential;
    if (this.randomCredential) {
      this.editCredentialForm.controls.acusername.setValue('');
      this.editCredentialForm.controls.acpassword.setValue('');
      this.editCredentialForm.controls.acusername.disable();
      this.editCredentialForm.controls.acpassword.disable();
    } else {
      this.editCredentialForm.controls.acusername.setValue(AutoscalerConstants.CredentialDefault.username);
      this.editCredentialForm.controls.acpassword.setValue(AutoscalerConstants.CredentialDefault.password);
      this.editCredentialForm.controls.acusername.enable();
      this.editCredentialForm.controls.acpassword.enable();
    }
  }

  createCredential() {
    let action: UpdateAppAutoscalerCredentialAction;
    if (this.randomCredential) {
      action = new UpdateAppAutoscalerCredentialAction(this.applicationService.appGuid, this.applicationService.cfGuid);
    } else {
      const credential: AppAutoscalerCredential = {
        username: this.editCredentialForm.controls.acusername.value,
        password: this.editCredentialForm.controls.acpassword.value,
      };
      if (!credential.username || !credential.password) {
        return;
      }
      action = new UpdateAppAutoscalerCredentialAction(this.applicationService.appGuid, this.applicationService.cfGuid, credential);
    }
    const updateAppAutoscalerCredentialService: EntityService = this.entityServiceFactory.create(
      this.applicationService.appGuid,
      action,
    );
    this.appAutoscalerCredential$ = updateAppAutoscalerCredentialService.entityObs$.pipe(
      map(({ entity }) => entity ? entity.entity : null),
      publishReplay(1),
      refCount()
    );
    updateAppAutoscalerCredentialService.entityMonitor.entityRequest$.pipe(
      filter(request => !!request.error),
      map(request => {
        const msg = request.message;
        request.error = false;
        request.message = '';
        return msg;
      }),
      distinctUntilChanged(),
    ).subscribe(errorMessage => {
      if (this.appAutoscalerCredentialSnackBarRef) {
        this.appAutoscalerCredentialSnackBarRef.dismiss();
      }
      this.appAutoscalerCredentialSnackBarRef = this.appAutoscalerCredentialSnackBar.open(errorMessage, 'Dismiss');
    });
    this.store.dispatch(action);
  }

  deleteCredentialConfirm() {
    const confirmation = new ConfirmationDialogConfig(
      'Delete Credential',
      'Are you sure you want to delete the credential?',
      'Delete',
      true
    );
    this.confirmDialog.open(confirmation, () => {
      const doUpdate = () => this.deleteCredential();
      doUpdate().pipe(
        first(),
      ).subscribe(actionState => {
        if (actionState.error) {
          this.appAutoscalerCredentialSnackBarRef =
            this.appAutoscalerCredentialSnackBar.open(`Failed to delete credential: ${actionState.message}`, 'Dismiss');
        }
      });
    });
  }

  deleteCredential(): Observable<ActionState> {
    const action = new DeleteAppAutoscalerCredentialAction(this.applicationService.appGuid, this.applicationService.cfGuid);
    this.store.dispatch(action);
    const entityKey = entityCatalog.getEntityKey(action);

    return this.store.select(selectDeletionInfo(entityKey, this.applicationService.appGuid)).pipe(
      pairwise(),
      filter(([oldV, newV]) => oldV.busy && !newV.busy),
      map(([, newV]) => newV)
    );
  }

}