import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnimeList } from './anime-list';

describe('AnimeList', () => {
  let component: AnimeList;
  let fixture: ComponentFixture<AnimeList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnimeList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnimeList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
