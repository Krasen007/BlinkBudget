export class ValidateDocsFixture {
  static declaredStaticMethod() {
    return true;
  }

  instanceMethod() {
    return false;
  }
}

export function declaredFunction() {
  return 'ok';
}

// Arrow function with unparenthesized single parameter
export const arrowFunctionMethod = param => {
  return param;
};

// Async arrow function with parenthesized parameters
export const asyncArrowFunction = async (a, b) => {
  return a + b;
};

// The following method reference is only mentioned in a comment and should not pass validation:
// commentedMethod()
