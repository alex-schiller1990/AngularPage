import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GamesDetail } from './games-detail';

describe('GamesDetail', () => {
  let component: GamesDetail;
  let fixture: ComponentFixture<GamesDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GamesDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GamesDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
