import { Injectable } from '@angular/core';
import { Http, Response, URLSearchParams, BaseRequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';

import { EventEntry } from './event-entry.model';
@Injectable()
export class EventEntryService {

    private resourceUrl = 'api/event-entries';
    private resourceSearchUrl = 'api/_search/event-entries';

    constructor(private http: Http) { }

    create(eventEntry: EventEntry): Observable<EventEntry> {
        let copy: EventEntry = Object.assign({}, eventEntry);
        return this.http.post(`api/event-editions/${eventEntry.eventEdition.id}/entries`, copy).map((res: Response) => {
            return res.json();
        });
    }

    update(eventEntry: EventEntry): Observable<EventEntry> {
        let copy: EventEntry = Object.assign({}, eventEntry);
        return this.http.put(`api/event-editions/${eventEntry.eventEdition.id}/entries`, copy).map((res: Response) => {
            return res.json();
        });
    }

    find(id: number): Observable<EventEntry> {
        return this.http.get(`api/event-editions/entries/${id}`).map((res: Response) => {
            return res.json();
        });
    }
    
    findEntries(id: number): Observable<Response> {
        return this.http.get(`api/event-editions/${id}/entries`).map((res: Response) => {
            return res;
        });
    }

    query(req?: any): Observable<Response> {
        let options = this.createRequestOption(req);
        return this.http.get(this.resourceUrl, options)
        ;
    }

    delete(id: number): Observable<Response> {
        return this.http.delete(`api/event-editions/entries/${id}`);
    }

    search(req?: any): Observable<Response> {
        let options = this.createRequestOption(req);
        return this.http.get(this.resourceSearchUrl, options)
        ;
    }


    private createRequestOption(req?: any): BaseRequestOptions {
        let options: BaseRequestOptions = new BaseRequestOptions();
        if (req) {
            let params: URLSearchParams = new URLSearchParams();
            params.set('page', req.page);
            params.set('size', req.size);
            if (req.sort) {
                params.paramsMap.set('sort', req.sort);
            }
            params.set('query', req.query);

            options.search = params;
        }
        return options;
    }
}
