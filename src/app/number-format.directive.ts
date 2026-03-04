import { Directive, ElementRef, HostListener, OnDestroy, OnInit, Optional, Self } from '@angular/core';
import { NgModel } from '@angular/forms';
import { Subscription } from 'rxjs';

@Directive({
  selector: 'input[appNumberFormat]',
  standalone: true,
})
export class NumberFormatDirective implements OnInit, OnDestroy {
  private sub?: Subscription;
  private focused = false;

  constructor(
    private el: ElementRef<HTMLInputElement>,
    @Self() @Optional() private ngModel: NgModel
  ) {}

  ngOnInit() {
    this.el.nativeElement.type = 'text';
    this.el.nativeElement.setAttribute('inputmode', 'numeric');
    this.sub = this.ngModel?.valueChanges?.subscribe(() => {
      if (!this.focused) this.showFormatted();
    });
    setTimeout(() => this.showFormatted());
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  @HostListener('focus')
  onFocus() {
    this.focused = true;
    const val = Number(this.ngModel?.value) || 0;
    this.el.nativeElement.value = val > 0 ? String(val) : '';
  }

  @HostListener('input')
  onInput() {
    const input = this.el.nativeElement;
    const raw = input.value.replace(/[^0-9]/g, '');
    const num = parseInt(raw, 10) || 0;
    const formatted = num > 0 ? num.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '';
    input.value = formatted;
    this.ngModel?.update.emit(num);
  }

  @HostListener('blur')
  onBlur() {
    this.focused = false;
    this.showFormatted();
  }

  private showFormatted() {
    const val = Number(this.ngModel?.value) || 0;
    this.el.nativeElement.value = val > 0
      ? val.toLocaleString('en-US', { maximumFractionDigits: 0 })
      : '';
  }
}
