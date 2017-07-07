import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Routes, CanActivate } from '@angular/router';

import { UserRouteAccessService } from '../../shared';
import { JhiPaginationUtil } from 'ng-jhipster';

import { PointsSystemComponent } from './points-system.component';
import { PointsSystemDetailComponent } from './points-system-detail.component';
import { PointsSystemPopupComponent } from './points-system-dialog.component';
import { PointsSystemDeletePopupComponent } from './points-system-delete-dialog.component';

import { Principal } from '../../shared';

@Injectable()
export class PointsSystemResolvePagingParams implements Resolve<any> {

  constructor(private paginationUtil: JhiPaginationUtil) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
      let page = route.queryParams['page'] ? route.queryParams['page'] : '1';
      let sort = route.queryParams['sort'] ? route.queryParams['sort'] : 'name,asc';
      return {
          page: this.paginationUtil.parsePage(page),
          predicate: this.paginationUtil.parsePredicate(sort),
          ascending: this.paginationUtil.parseAscending(sort)
    };
  }
}

export const pointsSystemRoute: Routes = [
  {
    path: 'points-system',
    component: PointsSystemComponent,
    resolve: {
      'pagingParams': PointsSystemResolvePagingParams
    },
    data: {
        authorities: ['ROLE_USER'],
        pageTitle: 'motorsportsDatabaseApp.pointsSystem.home.title'
    }
  }, {
    path: 'points-system/:id',
    component: PointsSystemDetailComponent,
    data: {
        authorities: ['ROLE_USER'],
        pageTitle: 'motorsportsDatabaseApp.pointsSystem.home.title'
    }
  }
];

export const pointsSystemPopupRoute: Routes = [
  {
    path: 'points-system-new',
    component: PointsSystemPopupComponent,
    data: {
        authorities: ['ROLE_USER'],
        pageTitle: 'motorsportsDatabaseApp.pointsSystem.home.title'
    },
    outlet: 'popup'
  },
  {
    path: 'points-system/:id/edit',
    component: PointsSystemPopupComponent,
    data: {
        authorities: ['ROLE_USER'],
        pageTitle: 'motorsportsDatabaseApp.pointsSystem.home.title'
    },
    outlet: 'popup'
  },
  {
    path: 'points-system/:id/delete',
    component: PointsSystemDeletePopupComponent,
    data: {
        authorities: ['ROLE_USER'],
        pageTitle: 'motorsportsDatabaseApp.pointsSystem.home.title'
    },
    outlet: 'popup'
  }
];
