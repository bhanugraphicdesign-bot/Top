import { Language } from '../types';

type ValidatableElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

function isValidatableElement(el: EventTarget | null): el is ValidatableElement {
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement
  );
}

function isPhoneField(el: ValidatableElement): boolean {
  const type = el instanceof HTMLInputElement ? (el.type || '').toLowerCase() : '';
  const nameAndId = `${el.name || ''} ${el.id || ''}`.toLowerCase();
  return type === 'tel' || nameAndId.includes('phone') || nameAndId.includes('mobile');
}

function isUtrField(el: ValidatableElement): boolean {
  const nameAndId = `${el.name || ''} ${el.id || ''}`.toLowerCase();
  return nameAndId.includes('utr');
}

function getHindiValidationMessage(el: ValidatableElement): string {
  const v = el.validity;
  if (v.valueMissing) {
    if (isPhoneField(el)) {
      return 'कृपया 10 अंकों का मोबाइल नंबर लिखें।';
    }
    if (isUtrField(el)) {
      return 'कृपया 12 अंकों का सही UTR नंबर लिखें।';
    }
    return 'कृपया यह जानकारी भरें।';
  }
  if (v.typeMismatch && el instanceof HTMLInputElement && el.type === 'email') {
    return 'कृपया मान्य ईमेल पता लिखें।';
  }
  if (v.patternMismatch || v.tooShort || v.tooLong) {
    if (isPhoneField(el)) {
      return 'कृपया 10 अंकों का मोबाइल नंबर लिखें।';
    }
    if (isUtrField(el)) {
      return 'कृपया 12 अंकों का सही UTR नंबर लिखें।';
    }
    return 'कृपया सही जानकारी भरें।';
  }
  if (v.rangeUnderflow || v.rangeOverflow || v.stepMismatch || v.badInput) {
    return 'कृपया मान्य संख्या दर्ज करें।';
  }
  return 'कृपया यह जानकारी सही से भरें।';
}

/**
 * Installs capture-phase listeners so browser validation bubbles display Hindi messages
 * when Hindi is selected, and standard English messages when English is selected.
 */
export function initFormValidationMessages(language: Language): () => void {
  if (typeof document === 'undefined') return () => {};

  // Clear any previously set custom validity messages whenever language changes
  document
    .querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      'input, textarea, select'
    )
    .forEach((field) => {
      if (field.validity.customError) {
        field.setCustomValidity('');
      }
    });

  const handleInvalid = (event: Event) => {
    if (!isValidatableElement(event.target)) return;
    const el = event.target;
    if (language === 'hi') {
      // Only compute Hindi message if customError isn't already explicitly set
      if (!el.validity.customError) {
        el.setCustomValidity(getHindiValidationMessage(el));
      }
    } else if (el.validity.customError) {
      el.setCustomValidity('');
    }
  };

  const handleClearValidity = (event: Event) => {
    if (!isValidatableElement(event.target)) return;
    event.target.setCustomValidity('');
  };

  document.addEventListener('invalid', handleInvalid, true);
  document.addEventListener('input', handleClearValidity, true);
  document.addEventListener('change', handleClearValidity, true);

  return () => {
    document.removeEventListener('invalid', handleInvalid, true);
    document.removeEventListener('input', handleClearValidity, true);
    document.removeEventListener('change', handleClearValidity, true);
  };
}
