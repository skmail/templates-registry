export function replaceVariables(
  str: string,
  variables: Record<string, string | number>,
): string {
  return str.replace(/{(\w+)}/g, (match, key: string) => {
    return variables[key] !== undefined ? String(variables[key]) : match;
  });
}

export function stripJsoncComments(jsoncString: string): string {
  return jsoncString.replace(
    /("(?:[^"\\]|\\.)*")|\/\/.*$/gm,
    (_match, group1: string | undefined) => {
      return group1 ? group1 : "";
    },
  );
}
