import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Response } from '@angular/http';

import { NgbActiveModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { EventManager, AlertService, JhiLanguageService, DataUtils } from 'ng-jhipster';

import { EventEdition, EventEditionService } from '../event-edition';
import { EventEntry } from './event-entry.model';
import { EventEntryPopupService } from './event-entry-popup.service';
import { EventEntryService } from './event-entry.service';
import { Driver } from '../driver';
import { Category } from '../category';

import { CompleterService, CompleterData, CompleterItem } from 'ng2-completer';

@Component({
    selector: 'jhi-event-entry-dialog',
    templateUrl: './event-entry-dialog.component.html'
})
export class EventEntryDialogComponent implements OnInit {

    eventEntry: EventEntry;
    authorities: any[];
    isSaving: boolean;
    private engineSearch: string;
    private driverSearch: string;
    private teamSearch: string;
    private operatedBySearch: string;
    private chassisSearch: string;
    private tyresSearch: string;
    private fuelSearch: string;

    dataServiceEngine: CompleterData;
    dataServiceDriver: CompleterData;
    dataServiceTeam: CompleterData;
    dataServiceTeamOperatedBy: CompleterData;
    dataServiceChassis: CompleterData;
    dataServiceFuel: CompleterData;
    dataServiceTyres: CompleterData;

    allowedCategories: Category[];

    constructor(
        public activeModal: NgbActiveModal,
        private jhiLanguageService: JhiLanguageService,
        private dataUtils: DataUtils,
        private alertService: AlertService,
        private eventEditionService: EventEditionService,
        private eventEntryService: EventEntryService,
        private eventManager: EventManager,
        private completerService: CompleterService,
        private route: ActivatedRoute,
        private router: Router,
    ) {
        this.dataServiceDriver = completerService.remote('api/_typeahead/drivers?query=', null, 'fullName');
        this.dataServiceTeam = completerService.remote('api/_typeahead/teams?query=', null, 'name');
        this.dataServiceTeamOperatedBy = completerService.remote('api/_typeahead/teams?query=', null, 'name');
        this.dataServiceEngine = completerService.remote('api/_typeahead/engines?query=', null, 'name').descriptionField('manufacturer');
        this.dataServiceChassis = completerService.remote('api/_typeahead/chassis?query=', null, 'name').descriptionField('manufacturer');
        this.dataServiceTyres = completerService.remote('api/_typeahead/tyres?query=', null, 'name');
        this.dataServiceFuel = completerService.remote('api/_typeahead/fuel?query=', null, 'name');
    }

    ngOnInit() {
        this.isSaving = false;
        this.authorities = ['ROLE_EDITOR', 'ROLE_ADMIN'];
        if (!this.eventEntry.id) {
            this.eventEditionService.find(this.eventEntry.eventEdition.id).subscribe(eventEdition => {
                this.eventEntry.eventEdition = eventEdition;
                this.allowedCategories = this.eventEntry.eventEdition.allowedCategories;
                if (this.allowedCategories.length === 1) {
                    this.eventEntry.category = this.allowedCategories[0];
                }
            });
        } else {
            this.allowedCategories = this.eventEntry.eventEdition.allowedCategories;
            if (!this.eventEntry.eventEdition.multidriver) {
                this.driverSearch = this.eventEntry.drivers[0].name + ' ' + this.eventEntry.drivers[0].surname;
            }
            this.engineSearch = this.eventEntry.engine.manufacturer + ' ' + this.eventEntry.engine.name;
            this.teamSearch = this.eventEntry.team.name;
            this.operatedBySearch = this.eventEntry.operatedBy ? this.eventEntry.operatedBy.name : null;
            this.chassisSearch = this.eventEntry.chassis.manufacturer + ' ' + this.eventEntry.chassis.name;
            this.tyresSearch = this.eventEntry.tyres ? this.eventEntry.tyres.name : null;
            this.fuelSearch = this.eventEntry.fuel ? this.eventEntry.fuel.name : null;
        }
    }
    
    byteSize(field) {
        return this.dataUtils.byteSize(field);
    }

    openFile(contentType, field) {
        return this.dataUtils.openFile(contentType, field);
    }

    setFileData($event, eventEntry, field, isImage) {
        if ($event.target.files && $event.target.files[0]) {
            let $file = $event.target.files[0];
            if (isImage && !/^image\//.test($file.type)) {
                return;
            }
            this.dataUtils.toBase64($file, (base64Data) => {
                eventEntry[field] = base64Data;
                eventEntry[`${field}ContentType`] = $file.type;
            });
        }
    }
    
    clear () {
        this.activeModal.dismiss('cancel');
    }

    save () {
        this.isSaving = true;
        if (this.eventEntry.id !== undefined) {
            this.eventEntryService.update(this.eventEntry)
                .subscribe((res: EventEntry) => this.onSaveSuccess(res), (res: Response) => this.onSaveError(res.json()));
        } else {
            this.eventEntryService.create(this.eventEntry)
                .subscribe((res: EventEntry) => this.onSaveSuccess(res), (res: Response) => this.onSaveError(res.json()));
        }
    }

    private onSaveSuccess (result: EventEntry) {
        this.eventManager.broadcast({ name: 'eventEntryListModification', content: 'OK'});
        this.isSaving = false;
        this.activeModal.dismiss(result);
    }

    private onSaveError (error) {
        this.isSaving = false;
        this.onError(error);
    }

    private onError (error) {
        this.alertService.error(error.message, null, null);
    }

    private onDriverSelected(selected: CompleterItem) {
        if (selected) {
            if (!this.eventEntry.eventEdition.multidriver) {
                this.eventEntry.drivers = [selected.originalObject.driver];
            } else {
                if (!this.eventEntry.drivers) {
                    this.eventEntry.drivers = new Array();
                }
                this.eventEntry.drivers.push(selected.originalObject.driver);
            }    
        } else {
            if (!this.eventEntry.eventEdition.multidriver) {
                this.eventEntry.drivers = null;
            }
        }
        this.driverSearch = null;
    }
    
    private removeDriver(event) {
        let selectedDriverId = event.target.value;
        let i : number = 0;
        for(let driver of this.eventEntry.drivers) {
            if (driver.id == selectedDriverId) {
                this.eventEntry.drivers.splice(i, 1);
            }
            i++;
        }
    }

    public onTeamSelected(selected: CompleterItem) {
        if (selected) {
            this.eventEntry.team = selected.originalObject;
            this.teamSearch = selected.originalObject.name;
        } else {
            this.eventEntry.team = null;
            this.teamSearch = null;
        }
    }

    public onOperatedBySelected(selected: CompleterItem) {
        if (selected) {
            this.eventEntry.operatedBy = selected.originalObject;
            this.operatedBySearch = selected.originalObject.name;
        } else {
            this.eventEntry.operatedBy = null;
            this.operatedBySearch = null;
        }
    }

    public onEngineSelected(selected: CompleterItem) {
        if (selected) {
            this.eventEntry.engine = selected.originalObject;
            this.engineSearch = selected.originalObject.manufacturer + ' ' + selected.originalObject.name;
        } else {
            this.eventEntry.engine = null;
            this.engineSearch = null;
        }
    }

    public onChassisSelected(selected: CompleterItem) {
        if (selected) {
            this.eventEntry.chassis = selected.originalObject;
            this.chassisSearch = selected.originalObject.manufacturer + ' ' + selected.originalObject.name;
        } else {
            this.eventEntry.chassis = null;
            this.chassisSearch = null;
        }
    }

    public onTyresSelected(selected: CompleterItem) {
        if (selected) {
            this.eventEntry.tyres = selected.originalObject;
            this.tyresSearch = selected.originalObject.manufacturer + ' ' + selected.originalObject.name;
        } else {
            this.eventEntry.tyres = null;
            this.tyresSearch = null;
        }
    }

    public onFuelSelected(selected: CompleterItem) {
        if (selected) {
            this.eventEntry.fuel = selected.originalObject;
            this.fuelSearch = selected.originalObject.manufacturer + ' ' + selected.originalObject.name;
        } else {
            this.eventEntry.fuel = null;
            this.fuelSearch = null;
        }
    }
    
    trackCategoryById(index: number, item: Category) {
        return item.id;
    }
}

@Component({
    selector: 'jhi-event-entry-popup',
    template: ''
})
export class EventEntryPopupComponent implements OnInit, OnDestroy {

    modalRef: NgbModalRef;
    routeSub: any;


    constructor (
        private route: ActivatedRoute,
        private eventEntryPopupService: EventEntryPopupService
    ) {
    }

    ngOnInit() {
        this.routeSub = this.route.params.subscribe(params => {
            let idEdition = params['idEdition'];
            if ( params['id'] ) {
                this.modalRef = this.eventEntryPopupService
                    .open(EventEntryDialogComponent, idEdition, params['id']);
            } else {
                this.modalRef = this.eventEntryPopupService
                    .open(EventEntryDialogComponent, idEdition);
            }

        });
    }

    ngOnDestroy() {
        this.routeSub.unsubscribe();
    }
}
