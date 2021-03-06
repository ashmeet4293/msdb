import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { JhiEventManager, JhiAlertService } from 'ng-jhipster';

import { EventEdition } from './event-edition.model';
import { EventEditionPopupService } from './event-edition-popup.service';
import { EventEditionService } from './event-edition.service';
import { Category, CategoryService } from '../category';
import { RacetrackLayout, RacetrackLayoutService } from '../racetrack-layout';
import { Event, EventService } from '../event';
import { ResponseWrapper } from '../../shared';

import { MIN_DATE, CURRENT_DATE, MAX_DATE } from '../../shared';

@Component({
    selector: 'jhi-event-edition-dialog',
    templateUrl: './event-edition-dialog.component.html',
    styleUrls: ['event-edition.css']
})
export class EventEditionDialogComponent implements OnInit {

    eventEdition: EventEdition;
    authorities: any[];
    isSaving: boolean;
    eventSelectorDisabled = false;
    searching = false;
    searchFailed = false;
    
    minDate = MIN_DATE;
    maxDate = MAX_DATE;

    categories: Category[];

    constructor(
        public activeModal: NgbActiveModal,
        private jhiAlertService: JhiAlertService,
        private eventEditionService: EventEditionService,
        private categoryService: CategoryService,
        private racetrackLayoutService: RacetrackLayoutService,
        private eventService: EventService,
        private eventManager: JhiEventManager
    ) {
    }

    ngOnInit() {
        this.isSaving = false;
        this.authorities = ['ROLE_EDITOR', 'ROLE_ADMIN'];
        this.categoryService.query({
            page: 0,
            query: '',
            size: 100,
            sort: ['name','asc']}).subscribe(
                (res: ResponseWrapper) => { this.categories = res.json; }, (res: ResponseWrapper) => this.onError(res.json));

    }
    
    private innersearch(term: string, layout: boolean) {
        if (term === '') {
            return of.call([]);
        }
        
        if (layout) {
            return map.call(this.racetrackLayoutService.searchLayout(term),
                    response => response.json);
        } else {
            return map.call(this.eventService.searchTypeahead(term),
                    response => response.json);
        }
    }
    
    searchLayouts = (text$: Observable<string>) =>
    _do.call(
      switchMap.call(
        _do.call(
          distinctUntilChanged.call(
            debounceTime.call(text$, 300)),
          () => this.searching = true),
        (term) =>
          _catch.call(
            _do.call(this.innersearch(term, true), () => this.searchFailed = false),
            () => {
              this.searchFailed = true;
              return of.call([]);
            }
          )
      ),
      () => this.searching = false);
    
    searchEvents = (text$: Observable<string>) =>
    _do.call(
      switchMap.call(
        _do.call(
          distinctUntilChanged.call(
            debounceTime.call(text$, 300)),
          () => this.searching = true),
        term =>
          _catch.call(
            _do.call(this.innersearch(term, false), () => this.searchFailed = false),
            () => {
              this.searchFailed = true;
              return of.call([]);
            }
          )
      ),
      () => this.searching = false);
    
    inputFormatterLayout = (result: any) => result.fullName;
    inputFormatterEvent = (result : any) => result.name;

    clear() {
        this.activeModal.dismiss('cancel');
    }

    save() {
        this.isSaving = true;
        const rl = new RacetrackLayout();
        rl.id = this.eventEdition.trackLayout.id;
        this.eventEdition.trackLayout = rl;
        if (this.eventEdition.id !== undefined) {
            this.subscribeToSaveResponse(
                this.eventEditionService.update(this.eventEdition));
        } else {
            this.subscribeToSaveResponse(
                this.eventEditionService.create(this.eventEdition));
        }
    }

    private subscribeToSaveResponse(result: Observable<EventEdition>) {
        result.subscribe((res: EventEdition) =>
            this.onSaveSuccess(res), (res: Response) => this.onSaveError());
    }

    private onSaveSuccess(result: EventEdition) {
        this.eventManager.broadcast({ name: 'eventEditionListModification', content: 'OK'});
        this.isSaving = false;
        this.activeModal.dismiss(result);
    }

    private onSaveError() {
        this.isSaving = false;
    }

    private onError(error: any) {
        this.jhiAlertService.error(error.message, null, null);
    }

    trackCategoryById(index: number, item: Category) {
        return item.id;
    }

    trackRacetrackLayoutById(index: number, item: RacetrackLayout) {
        return item.id;
    }

    trackEventById(index: number, item: Event) {
        return item.id;
    }
    
    public addCategories() {
        if (!this.eventEdition.allowedCategories) {
            this.eventEdition.allowedCategories = [];
        }
        let availableCategories = document.getElementById('field_availableCategories') as HTMLSelectElement;
        let i: number;
        let options = availableCategories.options;
        for(i = 0; i < options.length; i++) {
            if (options[i].selected) {
                let index = this.findIndexOfAllowedCategory(+options[i].value);
                if (index === -1) {
                    this.categoryService.find(+options[i].value).subscribe(
                        (res) => { this.eventEdition.allowedCategories.push(res); }, (res: Response) => this.onError(res.json()));
                }
            }
        }
    }
    
    public removeCategories() {
        let allowedCategories = document.getElementById('field_allowedCategories') as HTMLSelectElement;
        let i: number;
        for(i = allowedCategories.options.length - 1; i >= 0; i--) {
            if (allowedCategories.options[i].selected) {
                let index = this.findIndexOfAllowedCategory(+allowedCategories.options[i].value);
                this.eventEdition.allowedCategories.splice(index, 1);
            }
        }
    }
    
    private findIndexOfAllowedCategory(value: number) {
        let i = 0;
        for (let category of this.eventEdition.allowedCategories) {
            if (category.id === value) {
                return i;
            }
            i++;
        }
        return -1;
    }
}

@Component({
    selector: 'jhi-event-edition-popup',
    template: ''
})
export class EventEditionPopupComponent implements OnInit, OnDestroy {

    routeSub: any;

    constructor(
        private route: ActivatedRoute,
        private eventEditionPopupService: EventEditionPopupService
    ) {}

    ngOnInit() {
        this.routeSub = this.route.params.subscribe((params) => {
            if ( params['id'] ) {
                this.eventEditionPopupService
                    .open(EventEditionDialogComponent as Component, params['id']);
            } else {
                this.eventEditionPopupService
                    .open(EventEditionDialogComponent as Component);
            }
        });
    }

    ngOnDestroy() {
        this.routeSub.unsubscribe();
    }
}
