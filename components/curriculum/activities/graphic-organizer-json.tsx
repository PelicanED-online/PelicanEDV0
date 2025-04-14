"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Save } from "lucide-react"

// Define types for cell positions
type CellPosition = {
  row: number
  col: number
}

export function TableCreator() {
  const [step, setStep] = useState<"dimensions" | "data" | "result">("dimensions")
  const [columns, setColumns] = useState<number>(0)
  const [rows, setRows] = useState<number>(0)
  const [tableData, setTableData] = useState<string[][]>([])
  const [jsonResult, setJsonResult] = useState<string>("")

  // Track header and answer cells
  const [headerCells, setHeaderCells] = useState<CellPosition[]>([])
  const [answerCells, setAnswerCells] = useState<CellPosition[]>([])

  const handleDimensionsSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Initialize the table data with empty strings
    const initialData: string[][] = Array(rows)
      .fill(null)
      .map(() => Array(columns).fill(""))

    setTableData(initialData)
    setHeaderCells([])
    setAnswerCells([])
    setStep("data")
  }

  const handleDataChange = (rowIndex: number, colIndex: number, value: string) => {
    const newData = [...tableData]
    newData[rowIndex][colIndex] = value
    setTableData(newData)
  }

  // Check if a cell is a header
  const isCellHeader = (rowIndex: number, colIndex: number) => {
    return headerCells.some((cell) => cell.row === rowIndex && cell.col === colIndex)
  }

  // Check if a cell is an answer cell
  const isCellAnswer = (rowIndex: number, colIndex: number) => {
    return answerCells.some((cell) => cell.row === rowIndex && cell.col === colIndex)
  }

  // Get cell type (normal, header, or answer)
  const getCellType = (rowIndex: number, colIndex: number) => {
    if (isCellHeader(rowIndex, colIndex)) return "header"
    if (isCellAnswer(rowIndex, colIndex)) return "answer"
    return "normal"
  }

  // Set cell type
  const setCellType = (rowIndex: number, colIndex: number, type: string) => {
    // Remove from both arrays first
    setHeaderCells((prev) => prev.filter((cell) => !(cell.row === rowIndex && cell.col === colIndex)))
    setAnswerCells((prev) => prev.filter((cell) => !(cell.row === rowIndex && cell.col === colIndex)))

    // Then add to the appropriate array
    if (type === "header") {
      setHeaderCells((prev) => [...prev, { row: rowIndex, col: colIndex }])
    } else if (type === "answer") {
      setAnswerCells((prev) => [...prev, { row: rowIndex, col: colIndex }])
    }
  }

  const generateJson = () => {
    // Create a comprehensive JSON structure with metadata
    const result: {
      metadata: {
        structure: {
          rows: number
          columns: number
          headerCells: CellPosition[]
          answerCells: CellPosition[]
        }
      }
      data: {
        raw: string[][]
        formatted: Record<string, any>[]
      }
    } = {
      metadata: {
        structure: {
          rows,
          columns,
          headerCells,
          answerCells,
        },
      },
      data: {
        raw: tableData,
        formatted: [],
      },
    }

    // Process the data based on header cells
    // First, identify all header values and their positions
    const headerValues: Record<string, string> = {}

    // Collect all header values
    for (const cell of headerCells) {
      const value = tableData[cell.row][cell.col]
      if (value) {
        // Use row-col as a key to identify the header position
        headerValues[`${cell.row}-${cell.col}`] = value
      }
    }

    // Create formatted data
    // For each non-header row, create an object
    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
      // Skip rows that are entirely headers
      if (isRowEntirelyHeaders(rowIndex)) continue

      const rowObj: Record<string, any> = {}

      for (let colIndex = 0; colIndex < columns; colIndex++) {
        // Skip header cells
        if (isCellHeader(rowIndex, colIndex)) continue

        // Find a header for this column
        let headerValue = findHeaderForCell(rowIndex, colIndex)

        // If no header found, use default column name
        if (!headerValue) {
          headerValue = `Column ${colIndex + 1}`
        }

        // For answer cells, include metadata about it being an answer cell
        if (isCellAnswer(rowIndex, colIndex)) {
          rowObj[headerValue] = {
            value: tableData[rowIndex][colIndex],
            isAnswer: true,
          }
        } else {
          rowObj[headerValue] = tableData[rowIndex][colIndex]
        }
      }

      // Only add if the object has properties
      if (Object.keys(rowObj).length > 0) {
        result.data.formatted.push(rowObj)
      }
    }

    setJsonResult(JSON.stringify(result, null, 2))
    setStep("result")
  }

  // Placeholder for save function (to be implemented later)
  const handleSave = () => {
    // This function would be implemented when integrating with a database
    console.log("Save to database:", jsonResult)
    // Show success message or feedback to user
    alert("Table data ready to save! (Database integration will be added later)")
  }

  // Helper function to check if a row is entirely headers
  const isRowEntirelyHeaders = (rowIndex: number) => {
    for (let colIndex = 0; colIndex < columns; colIndex++) {
      if (!isCellHeader(rowIndex, colIndex)) {
        return false
      }
    }
    return true
  }

  // Helper function to find a header for a cell
  const findHeaderForCell = (rowIndex: number, colIndex: number) => {
    // Look for headers in the same column (above the current cell)
    for (let r = 0; r < rows; r++) {
      if (r !== rowIndex && isCellHeader(r, colIndex)) {
        return tableData[r][colIndex]
      }
    }

    // Look for headers in the same row (to the left of the current cell)
    for (let c = 0; c < columns; c++) {
      if (c !== colIndex && isCellHeader(rowIndex, c)) {
        return tableData[rowIndex][c]
      }
    }

    return null
  }

  return (
    <Card className="max-w-4xl mx-auto border-[#ff3300]/20">
      <CardHeader className="border-b border-[#ff3300]/10">
        <CardTitle className="text-[#ff3300]">
          {step === "dimensions" && "Step 1: Define Table Dimensions"}
          {step === "data" && "Step 2: Enter Table Data & Mark Special Cells"}
          {step === "result" && "Step 3: Review & Save JSON Data"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {step === "dimensions" && (
          <form onSubmit={handleDimensionsSubmit} className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="columns">Number of Columns</Label>
                <Input
                  id="columns"
                  type="number"
                  min="1"
                  max="20"
                  required
                  value={columns || ""}
                  onChange={(e) => setColumns(Number.parseInt(e.target.value) || 0)}
                  placeholder="Enter number of columns"
                  className="focus-visible:ring-[#ff3300]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rows">Number of Rows</Label>
                <Input
                  id="rows"
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={rows || ""}
                  onChange={(e) => setRows(Number.parseInt(e.target.value) || 0)}
                  placeholder="Enter number of rows"
                  className="focus-visible:ring-[#ff3300]"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={columns <= 0 || rows <= 0}
              className="bg-[#ff3300] hover:bg-[#e62e00] text-white"
            >
              Continue to Data Entry
            </Button>
          </form>
        )}

        {step === "data" && (
          <div className="space-y-6 pt-4">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">For each cell, select its type:</p>
              <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                <li>
                  <span className="font-medium">Normal</span> - Regular data cell
                </li>
                <li>
                  <span className="font-medium">Header</span> - Used as property names in the JSON
                </li>
                <li>
                  <span className="font-medium text-[#ff3300]">Answer</span> - Designated for student answers
                </li>
              </ul>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 border bg-gray-100 text-left w-24">Row/Col</th>
                    {Array.from({ length: columns }).map((_, colIndex) => (
                      <th key={colIndex} className="p-2 border bg-gray-100 text-center">
                        <span>Col {colIndex + 1}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      <td className="p-2 border bg-gray-50">
                        <span>Row {rowIndex + 1}</span>
                      </td>
                      {row.map((cell, colIndex) => (
                        <td
                          key={colIndex}
                          className={cn(
                            "p-2 border",
                            isCellHeader(rowIndex, colIndex) && "bg-blue-100",
                            isCellAnswer(rowIndex, colIndex) && "bg-[#fff0ee]",
                          )}
                        >
                          <div className="space-y-2">
                            <Input
                              value={cell}
                              onChange={(e) => handleDataChange(rowIndex, colIndex, e.target.value)}
                              placeholder={
                                isCellHeader(rowIndex, colIndex)
                                  ? "Header name"
                                  : isCellAnswer(rowIndex, colIndex)
                                    ? "Answer placeholder"
                                    : "Value"
                              }
                              className={cn(
                                "focus-visible:ring-[#ff3300]",
                                isCellHeader(rowIndex, colIndex) && "font-medium",
                                isCellAnswer(rowIndex, colIndex) && "border-[#ff3300] bg-[#fff5f3]",
                              )}
                            />
                            <ToggleGroup
                              type="single"
                              size="sm"
                              value={getCellType(rowIndex, colIndex)}
                              onValueChange={(value) => {
                                if (value) setCellType(rowIndex, colIndex, value)
                              }}
                              className="justify-center"
                            >
                              <ToggleGroupItem value="normal" className="text-xs px-2">
                                Normal
                              </ToggleGroupItem>
                              <ToggleGroupItem value="header" className="text-xs px-2">
                                Header
                              </ToggleGroupItem>
                              <ToggleGroupItem
                                value="answer"
                                className="text-xs px-2 data-[state=on]:bg-[#ff3300] data-[state=on]:text-white"
                              >
                                Answer
                              </ToggleGroupItem>
                            </ToggleGroup>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setStep("dimensions")}
                className="border-[#ff3300]/20 text-[#ff3300] hover:bg-[#fff5f3] hover:text-[#e62e00]"
              >
                Back
              </Button>
              <Button onClick={generateJson} className="bg-[#ff3300] hover:bg-[#e62e00] text-white">
                Generate JSON
              </Button>
            </div>
          </div>
        )}

        {step === "result" && (
          <div className="space-y-6 pt-4">
            <div className="p-4 border rounded-md border-[#ff3300]/20 bg-[#fff8f7] max-h-[400px] overflow-y-auto">
              <pre className="whitespace-pre-wrap break-all">{jsonResult}</pre>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("data")}
                className="border-[#ff3300]/20 text-[#ff3300] hover:bg-[#fff5f3] hover:text-[#e62e00]"
              >
                Back to Data
              </Button>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(jsonResult)
                }}
                variant="outline"
                className="border-[#ff3300]/20 text-[#ff3300] hover:bg-[#fff5f3] hover:text-[#e62e00]"
              >
                Copy to Clipboard
              </Button>
              <Button onClick={handleSave} className="bg-[#ff3300] hover:bg-[#e62e00] text-white">
                <Save className="w-4 h-4 mr-2" />
                Save Table
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
