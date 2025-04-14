"use client"

import type React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Button } from "@/components/ui/button"

interface TableGraphicOrganizerProps {
  columns: number
  rows: number
  tableData: any
  headerCells: { row: number; col: number }[]
  answerCells: { row: number; col: number }[]
  setTableData: (data: any) => void
  setHeaderCells: (cells: { row: number; col: number }[]) => void
  setAnswerCells: (cells: { row: number; col: number }[]) => void
}

// Generate a random ID for new rows
const generateId = () => Math.random().toString(36).substring(2, 9)

const TableGraphicOrganizer: React.FC<TableGraphicOrganizerProps> = ({
  columns,
  rows,
  tableData,
  headerCells,
  answerCells,
  setTableData,
  setHeaderCells,
  setAnswerCells,
}) => {
  const handleDataChange = (rowIndex: number, colIndex: number, value: string) => {
    const newData = {
      ...tableData,
      rows: tableData.rows.map((row, i) =>
        i === rowIndex
          ? {
              ...row,
              cells: row.cells.map((cell, j) => (j === colIndex ? value : cell)),
            }
          : row,
      ),
    }
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

  const addColumn = () => {
    setTableData((prev) => ({
      ...prev,
      headers: [...prev.headers, ""],
      rows: prev.rows.map((row) => ({
        ...row,
        cells: [...row.cells, ""],
      })),
    }))
  }

  const removeColumn = (index: number) => {
    if (tableData.headers.length <= 2) return // Minimum 2 columns

    setTableData((prev) => ({
      ...prev,
      headers: prev.headers.filter((_, i) => i !== index),
      rows: prev.rows.map((row) => ({
        ...row,
        cells: row.cells.filter((_, i) => i !== index),
      })),
    }))
    setHeaderCells((prev) => prev.map((cell) => (cell.col > index ? { ...cell, col: cell.col - 1 } : cell)))
    setAnswerCells((prev) => prev.map((cell) => (cell.col > index ? { ...cell, col: cell.col - 1 } : cell)))
  }

  const addRow = () => {
    setTableData((prev) => ({
      ...prev,
      rows: [...prev.rows, { id: generateId(), cells: Array(prev.headers.length).fill("") }],
    }))
  }

  const removeRow = (id: string) => {
    setTableData((prev) => ({
      ...prev,
      rows: prev.rows.filter((row) => row.id !== id),
    }))
    setHeaderCells((prev) => prev.filter((cell) => cell.row !== id))
    setAnswerCells((prev) => prev.filter((cell) => cell.row !== id))
  }

  return (
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
              {tableData.headers.map((_, colIndex) => (
                <th key={colIndex} className="p-2 border bg-gray-100 text-center">
                  <span>Col {colIndex + 1}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.rows.map((row, rowIndex) => (
              <tr key={row.id}>
                <td className="p-2 border bg-gray-50">
                  <span>Row {rowIndex + 1}</span>
                </td>
                {row.cells.map((cell, colIndex) => (
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
        <Button variant="outline" onClick={addRow}>
          Add Row
        </Button>
        <Button variant="outline" onClick={addColumn}>
          Add Column
        </Button>
      </div>
    </div>
  )
}

export default TableGraphicOrganizer
