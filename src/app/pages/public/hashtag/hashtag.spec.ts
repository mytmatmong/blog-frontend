import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Hashtag } from './hashtag';

describe('Hashtag', () => {
  let component: Hashtag;
  let fixture: ComponentFixture<Hashtag>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Hashtag],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Hashtag);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
