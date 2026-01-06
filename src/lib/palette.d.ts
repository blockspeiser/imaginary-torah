declare module "@/lib/palette" {
  const palette: {
    colors: Record<string, string>
    categoryColors: Record<string, string>
    categoryColor: (cat: unknown) => string
  }

  export default palette
}
