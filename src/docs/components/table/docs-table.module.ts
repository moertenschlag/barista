import { NgModule } from '@angular/core';

import { DocsTableComponent } from './docs-table.component';
import { UiModule } from '../../ui/ui.module';
import { CommonModule } from '@angular/common';
import { DtThemingModule, DtTableModule, DtLoadingDistractorModule } from '@dynatrace/angular-components';
import { TableDefaultComponent } from './examples/table-default.component';
import { TableDifferentWidthComponent } from './examples/table-different-width.component';
import { TableEmptyStateComponent } from './examples/table-empty-state.component';
import { TableEmptyCustomStateComponent } from './examples/table-empty-custom-state.component';
import { TableObservableComponent } from './examples/table-observable.component';
import { TableLoadingComponent } from './examples/table-loading.component';

const EXAMPLES = [
  TableDefaultComponent,
  TableDifferentWidthComponent,
  TableEmptyStateComponent,
  TableEmptyCustomStateComponent,
  TableObservableComponent,
  TableLoadingComponent,
];

@NgModule({
  imports: [
    CommonModule,
    UiModule,
    DtThemingModule,
    DtTableModule,
    DtLoadingDistractorModule,
  ],
  exports: [
    DocsTableComponent,
  ],
  declarations: [
    ...EXAMPLES,
    DocsTableComponent,
  ],
  entryComponents: [
    ...EXAMPLES,
  ],
})
export class DocsTableModule { }
