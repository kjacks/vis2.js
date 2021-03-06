

import * as React from 'react'

export function highlightText(text: string, query: string) {
  let lastIndex = 0;
  const words = query
    .split(/\s+/)
    .filter(word => word.length > 0)
    .map((text: string) => {
      return text.replace(/([.*+?^=!:${}()|[\]/\\])/g, "\\$1");
    });
  if (words.length === 0) {
    return [text];
  }
  const regexp = new RegExp(words.join("|"), "gi");
  const tokens: React.ReactNode[] = [];
  while (true) {
    const match = regexp.exec(text);
    if (!match) {
      break;
    }
    const length = match[0].length;
    const before = text.slice(lastIndex, regexp.lastIndex - length);
    if (before.length > 0) {
      tokens.push(before);
    }
    lastIndex = regexp.lastIndex;
    tokens.push(<strong key={lastIndex}>{match[0]}</strong>);
  }
  const rest = text.slice(lastIndex);
  if (rest.length > 0) {
    tokens.push(rest);
  }
  return tokens;
}

export function matchText(term: string, query: string): boolean {
  return term.trim().toLowerCase().indexOf(query.trim().toLowerCase()) !== -1
}

/*
 * https://stackoverflow.com/questions/23618744/rendering-comma-separated-list-of-links
 */
export function wordList(arr:Array<any>, sep:string) {
  if (arr.length === 0) {
    return [];
  }

  return arr.slice(1).reduce((xs, x) => xs.concat([sep, x]), [arr[0]]);
}

export function getHost(url:string) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return url;
  }
}
