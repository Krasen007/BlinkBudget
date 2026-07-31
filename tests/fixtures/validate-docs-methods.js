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

// The following method reference is only mentioned in a comment and should not pass validation:
// commentedMethod()
