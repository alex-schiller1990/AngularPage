import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GamesList } from './games-list';

describe('GamesList', () => {
  let component: GamesList;
  let fixture: ComponentFixture<GamesList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GamesList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GamesList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
