export interface KeyValues {
	[key: string]: any;
}

// Source: https://stackoverflow.com/questions/69821826/typescript-string-autocomplete-object-structure-midway
type KeysUnion<T, Cache extends string = ''> =
	(T extends PropertyKey
		? Cache
		: { [P in keyof T]:
			(P extends string
				? (Cache extends ''
					? KeysUnion<T[P], `${P}`>
					: Cache | KeysUnion<T[P], `${Cache}.${P}`>)
				: never)
		}[keyof T])