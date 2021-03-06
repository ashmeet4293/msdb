import { Component, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Response } from '@angular/http';

import { Observable } from 'rxjs/Rx';
import {map} from 'rxjs/operator/map';
import {debounceTime} from 'rxjs/operator/debounceTime';
import {distinctUntilChanged} from 'rxjs/operator/distinctUntilChanged';
import {_catch} from 'rxjs/operator/catch';
import {_do} from 'rxjs/operator/do';
import {switchMap} from 'rxjs/operator/switchMap';
import {of} from 'rxjs/observable/of';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { JhiEventManager, JhiAlertService, JhiDataUtils } from 'ng-jhipster';

import { Engine } from './engine.model';
import { EnginePopupService } from './engine-popup.service';
import { EngineService } from './engine.service';
import { ResponseWrapper } from '../../shared';

@Component({
    selector: 'jhi-engine-dialog',
    templateUrl: './engine-dialog.component.html'
})
export class EngineDialogComponent implements OnInit {

    engine: Engine;
    authorities: any[];
    isSaving: boolean;
    searching = false;
    searchFailed = false;

    constructor(
        public activeModal: NgbActiveModal,
        private dataUtils: JhiDataUtils,
        private jhiAlertService: JhiAlertService,
        private engineService: EngineService,
        private elementRef: ElementRef,
        private eventManager: JhiEventManager
    ) {
    }

    ngOnInit() {
        this.isSaving = false;
        this.authorities = ['ROLE_EDITOR', 'ROLE_ADMIN'];
    }
    byteSize(field) {
        return this.dataUtils.byteSize(field);
    }

    openFile(contentType, field) {
        return this.dataUtils.openFile(contentType, field);
    }

    setFileData(event, entity, field, isImage) {
        this.dataUtils.setFileData(event, entity, field, isImage);
    }

    clearInputImage(field: string, fieldContentType: string, idInput: string) {
        this.dataUtils.clearInputImage(this.engine, this.elementRef, field, fieldContentType, idInput);
    }

    clear() {
        this.activeModal.dismiss('cancel');
    }

    save() {
        this.isSaving = true;
        if (this.engine.id !== undefined) {
            this.subscribeToSaveResponse(
                this.engineService.update(this.engine));
        } else {
            this.subscribeToSaveResponse(
                this.engineService.create(this.engine));
        }
    }

    private subscribeToSaveResponse(result: Observable<Engine>) {
        result.subscribe((res: Engine) =>
            this.onSaveSuccess(res), (res: Response) => this.onSaveError());
    }

    private onSaveSuccess(result: Engine) {
        this.eventManager.broadcast({ name: 'engineListModification', content: 'OK'});
        this.isSaving = false;
        this.activeModal.dismiss(result);
    }

    private onSaveError() {
        this.isSaving = false;
    }

    private onError(error: any) {
        this.jhiAlertService.error(error.message, null, null);
    }

    trackEngineById(index: number, item: Engine) {
        return item.id;
    }

    private innerEngineSearch(term: string) {
        if (term === '') {
          return of.call([]);
        }
        return map.call(this.engineService.typeahead(term),
          (response) => response.json);
      }

    searchEngine = (text$: Observable<string>) => _do.call(
        switchMap.call(
          _do.call(distinctUntilChanged.call(debounceTime.call(text$, 300)), () => this.searching = true),
          (term) => _catch.call(
              _do.call(this.innerEngineSearch(term), () => this.searchFailed = false),
              () => {
                this.searchFailed = true;
                return of.call([]);
              }
            )
        ),
        () => this.searching = false);

    inputEngineFormatter = (result: any) => result.manufacturer + ' ' + result.name;
}

@Component({
    selector: 'jhi-engine-popup',
    template: ''
})
export class EnginePopupComponent implements OnInit, OnDestroy {

    routeSub: any;

    constructor(
        private route: ActivatedRoute,
        private enginePopupService: EnginePopupService
    ) {}

    ngOnInit() {
        this.routeSub = this.route.params.subscribe((params) => {
            if ( params['id'] ) {
                this.enginePopupService
                    .open(EngineDialogComponent as Component, params['id']);
            } else {
                this.enginePopupService
                    .open(EngineDialogComponent as Component);
            }
        });
    }

    ngOnDestroy() {
        this.routeSub.unsubscribe();
    }
}
