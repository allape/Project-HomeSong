package helper

func OverflowedArrayTrimmer[T any](array []T, max int) []T {
	if len(array) > max {
		return array[:max]
	}
	return array
}

func OverflowedArrayFilter(max int) func([]string) []string {
	return func(value []string) []string {
		return OverflowedArrayTrimmer(value, max)
	}
}
