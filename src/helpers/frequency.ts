const frequencyList = [
    'advanced',
    'weekly'
  ]

  export const frequencyOptions: [name: string, value: string][] = frequencyList.map(x => {
      return [x, x]
  })