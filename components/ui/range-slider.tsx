"use client"

import * as SliderPrimitive from "@radix-ui/react-slider"
import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface RangeSliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  label?: string
  totalAmount?: number
  showAmountInputs?: boolean
  formatValue?: (value: number) => string
  parseValue?: (input: string) => number
}

const RangeSlider = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Root>,
  RangeSliderProps
>(
  (
    {
      className,
      label,
      totalAmount,
      showAmountInputs = false,
      formatValue,
      parseValue,
      value = [25, 50],
      onValueChange,
      min = 0,
      max = 100,
      step = 1,
      ...props
    },
    ref,
  ) => {
    const minInputId = React.useId()
    const maxInputId = React.useId()
    const [localValue, setLocalValue] = React.useState(value)
    const [minInput, setMinInput] = React.useState("")
    const [maxInput, setMaxInput] = React.useState("")

    // Update local value when prop changes
    React.useEffect(() => {
      setLocalValue(value)
      if (totalAmount) {
        // Always update inputs to match slider value - slider takes priority
        const calculatedMin = Math.round((totalAmount * value[0]) / 100).toString()
        const calculatedMax = Math.round((totalAmount * value[1]) / 100).toString()

        setMinInput(calculatedMin)
        setMaxInput(calculatedMax)
      }
    }, [value, totalAmount])

    const handleSliderChange = (newValue: number[]) => {
      setLocalValue(newValue)
      onValueChange?.(newValue)

      if (totalAmount) {
        const newMinAmount = Math.round((totalAmount * newValue[0]) / 100).toString()
        const newMaxAmount = Math.round((totalAmount * newValue[1]) / 100).toString()

        // Always update input fields when slider is used - slider takes priority
        setMinInput(newMinAmount)
        setMaxInput(newMaxAmount)
      }
    }

    const handleMinInputChange = (inputValue: string) => {
      setMinInput(inputValue)

      if (totalAmount && inputValue.trim()) {
        const amount = parseValue
          ? parseValue(inputValue)
          : Number(inputValue.replace(/[^0-9]/g, ""))
        if (!Number.isNaN(amount) && amount > 0) {
          const percentage = Math.round((amount / totalAmount) * 100)
          // Only update if within reasonable bounds and doesn't exceed max
          if (percentage >= min && percentage <= localValue[1]) {
            const newValue = [percentage, localValue[1]]
            setLocalValue(newValue)
            onValueChange?.(newValue)
          }
        }
      }
    }

    const handleMaxInputChange = (inputValue: string) => {
      setMaxInput(inputValue)

      if (totalAmount && inputValue.trim()) {
        const amount = parseValue
          ? parseValue(inputValue)
          : Number(inputValue.replace(/[^0-9]/g, ""))
        if (!Number.isNaN(amount) && amount > 0) {
          const percentage = Math.round((amount / totalAmount) * 100)
          // Only update if within reasonable bounds and doesn't go below min
          if (percentage <= max && percentage >= localValue[0]) {
            const newValue = [localValue[0], percentage]
            setLocalValue(newValue)
            onValueChange?.(newValue)
          }
        }
      }
    }

    // Validation helpers
    const getMinInputValidation = () => {
      if (!(totalAmount && minInput.trim())) return null
      const amount = Number(minInput.replace(/[^0-9]/g, ""))
      if (Number.isNaN(amount) || amount <= 0) return null
      const percentage = Math.round((amount / totalAmount) * 100)
      if (percentage < min) return `Minimaal ${min}% benodigd`
      if (percentage > Math.round(localValue[1])) return `Cannot exceed maximum amount`
      return null
    }

    const getMaxInputValidation = () => {
      if (!(totalAmount && maxInput.trim())) return null
      const amount = Number(maxInput.replace(/[^0-9]/g, ""))
      if (Number.isNaN(amount) || amount <= 0) return null
      const percentage = Math.round((amount / totalAmount) * 100)
      if (percentage > max) return `Maximaal ${max}% toegestaan`
      if (percentage < Math.round(localValue[0]))
        return `Kan niet lager zijn dan ${Math.round(localValue[0])}%`
      return null
    }

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("nl-NL", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount)
    }

    return (
      <div className="space-y-4">
        {label && (
          <div className="flex items-center justify-between">
            <Label className="font-medium text-sm">{label}</Label>
            <span className="font-semibold text-sm">
              {formatValue
                ? `${formatValue(localValue[0])} - ${formatValue(localValue[1])}`
                : `${Math.round(localValue[0])}% - ${Math.round(localValue[1])}%`}
            </span>
          </div>
        )}

        <SliderPrimitive.Root
          ref={ref}
          className={cn("relative flex w-full touch-none select-none items-center", className)}
          value={localValue}
          onValueChange={handleSliderChange}
          min={min}
          max={max}
          step={step}
          {...props}
        >
          <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
            <SliderPrimitive.Range className="absolute h-full bg-primary" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
          <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
        </SliderPrimitive.Root>

        {/* Percentage tickers */}
        <div className="relative">
          <div className="flex justify-between text-muted-foreground text-xs">
            {Array.from({ length: 9 }, (_, i) => (i + 1) * 10).map(tick => (
              <div key={tick} className="flex flex-col items-center">
                <div className="h-2 w-px bg-border"></div>
                <span>{tick}%</span>
              </div>
            ))}
          </div>
        </div>

        {showAmountInputs && totalAmount && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor={minInputId} className="text-muted-foreground text-xs">
                Minimaal bedrag
              </Label>
              <Input
                id={minInputId}
                value={minInput}
                onChange={e => handleMinInputChange(e.target.value)}
                placeholder="Enter amount"
                className={`text-sm ${getMinInputValidation() ? "border-red-500" : ""}`}
              />
              <div className="text-xs">
                {getMinInputValidation() ? (
                  <span className="text-red-600">{getMinInputValidation()}</span>
                ) : (
                  <span className="text-muted-foreground">
                    {formatCurrency(Math.round((totalAmount * localValue[0]) / 100))}
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor={maxInputId} className="text-muted-foreground text-xs">
                Maximaal bedrag
              </Label>
              <Input
                id={maxInputId}
                value={maxInput}
                onChange={e => handleMaxInputChange(e.target.value)}
                placeholder="Enter amount"
                className={`text-sm ${getMaxInputValidation() ? "border-red-500" : ""}`}
              />
              <div className="text-xs">
                {getMaxInputValidation() ? (
                  <span className="text-red-600">{getMaxInputValidation()}</span>
                ) : (
                  <span className="text-muted-foreground">
                    {formatCurrency(Math.round((totalAmount * localValue[1]) / 100))}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  },
)

RangeSlider.displayName = "RangeSlider"

export { RangeSlider }
