import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { getStatusLabel } from "@/shared/utils/getStatusLabel";
import { useAuth } from "@/app/providers/AuthProvider";
import { useSearch } from "@/app/providers/UserSearchProvider";
import { OcrSearchRequest } from "@/shared/api";
import { InvoiceContent } from "@/shared/model";
import { TruncateFileName } from "@/shared/utils";
import ApprovalModal from "@/shared/ui/ApprovalModal";
import { StepProvider } from "@/app/providers/StepProvider";
import EditApprovalModal from "@/shared/ui/EditModal";
import PreviewModal from "@/shared/ui/PreviewModal";
import { DeleteRequest } from "@/feature/searchFile/service/DeleteRequest";
import { DownloadExcel } from "../api/DownloadExcel";
import { useToast } from "@/app/providers/ToastProvider";
import Errorconform from "./Alert/Errorconform";
import StatusTooltip from "./Tooltip/StatusTooltip";

export default function UserTable() {
  const { getUser, userRole } = useAuth();
  const { filters, getSearchParams, isInitialState } = useSearch();
  const { addToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<number[]>([]); // 선택된 cell 값들 저장
  const [data, setData] = useState<InvoiceContent[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0); // 총 페이지 수
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<string | null>(null);
  const [selectedRowId, setSeletedRowId] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const itemsPerPage = 10; // 페이지별 아이템 개수

  const fetchData = async () => {
    const searchParams = getSearchParams();
    searchParams.page = isInitialState() ? currentPage : 1;
    const token = getUser();
    try {
      const response = await OcrSearchRequest(token, searchParams);
      const data = response.result.content;
      setData(data);
      setTotalPages(response.result.totalPages);
    } catch (error) {
      console.log("업무 데이터를 불러오는데 실패했습니다.", error);
    }
  };

  useEffect(() => {
    const params = getSearchParams();
    console.log(params);
    fetchData();
  }, [currentPage, filters]); // 페이지가 바뀌거나 params를 바꾼뒤 조회를 누르면 fetch

  const openModal = (row: InvoiceContent, index: number) => {
    setSelectedIndex(String((currentPage - 1) * itemsPerPage + index + 1).padStart(3, "0"));
    setSeletedRowId(row.id);

    if (row.status === "APPROVED") {
      setIsModalOpen(true);
    }
    if (row.status === "UNAPPROVED") {
      setIsEditModalOpen(true);
    }
  };
  const openPreview = (url: string) => {
    setPreviewUrl(url);
    setIsPreviewOpen(true);
  };

  const toggleRowSelection = (id: number) => {
    setSelectedRows(prev => (prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    setSelectedRows(prev => {
      const currentPageRowIds = data.map(row => row.id);
      return prev.length === currentPageRowIds.length ? [] : currentPageRowIds;
    });
  };

  const formatDate = (dateArray: number[]): string => {
    if (dateArray.length < 3) {
      throw new Error("Invalid date array. At least [year, month, day] are required.");
    }

    const [year, month, day] = dateArray;
    const formattedYear = String(year).slice(2); // 연도 두 자리
    const formattedMonth = String(month).padStart(2, "0"); // 01~12 보장
    const formattedDay = String(day).padStart(2, "0"); // 01~31 보장

    return `${formattedYear}.${formattedMonth}.${formattedDay}`;
  };

  const handleDelete = async () => {
    const token = getUser();
    if (selectedRows.length === 0) {
      addToast("삭제할 항목을 선택하세요", "error");
      return;
    }
    if (!token) {
      console.error("인증 토큰이 없습니다.");
      return;
    }

    const taxInvoiceIdList = selectedRows
      .map(rowId => {
        const rowData = data.find(row => row.id === rowId);
        return rowData?.id;
      })
      .filter(id => id !== undefined);

    try {
      await DeleteRequest(taxInvoiceIdList as number[], token);

      setSelectedRows([]);
      fetchData();
      addToast("파일이 삭제되었습니다.", "success");
    } catch (error) {
      console.log("삭제 실패", error);
      addToast("삭제하는데 실패했습니다..", "error");
    }
  };

  const downloadExcelFile = async () => {
    const token = getUser();
    if (selectedRows.length === 0) {
      addToast("내보낼 항목을 선택하세요", "error");
      return;
    }
    try {
      await DownloadExcel(token, selectedRows);
    } catch (error) {
      console.log("내보내기 실패", error);
    }
  };

  return (
    <div className="p-[20px] bg-[#FFF] rounded-lg">
      <div className="flex justify-between mb-7">
        <div className="flex gap-3 items-center">
          <span className="text-title-sm text-gray-800">검증 내역</span>
          <StatusTooltip />
        </div>

        <div className="flex space-x-[15px]">
          <Button
            className="py-3.5 px-6 bg-[#FFF] text-green-500 border border-green-500 hover:bg-white disabled:opacity-100 disabled:border-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed"
            disabled={selectedRows.length === 0}
            onClick={downloadExcelFile}>
            내보내기
          </Button>
          <Errorconform
            btnName="삭제하기"
            onClick={handleDelete}
            disabled={selectedRows.length === 0}
            className="py-3.5 px-6 bg-green-500 hover:bg-green-600 text-[#FFF] disabled:opacity-100 disabled:cursor-not-allowed disabled:bg-gray-100"
          />
        </div>
      </div>
      <Table>
        <TableHeader className="h-[57px]">
          <TableRow>
            <TableHead>
              <Checkbox
                checked={data.length > 0 && data.every(row => selectedRows.includes(row.id))}
                onCheckedChange={toggleSelectAll}
                className="h-[24px] w-[24px] bg-gray-50 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
              />
            </TableHead>
            <TableHead>번호</TableHead>
            <TableHead>공급자</TableHead>
            <TableHead>공급받는자</TableHead>
            {userRole === "ROLE_ADMIN" && <TableHead>담당자</TableHead>}
            <TableHead>날짜</TableHead>
            <TableHead>미리보기</TableHead>
            <TableHead className="text-center">승인여부</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((row, index) => (
              <TableRow
                key={row.id}
                className={`h-[68px] text-body-sm cursor-pointer ${selectedRows.includes(row.id) ? "bg-green-0 hover:bg-green-0" : ""}`}
                onClick={() => openModal(row, index)}>
                <TableCell className="w-[70px]">
                  <Checkbox
                    className="h-[24px] w-[24px] bg-gray-50 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 cursor-pointer"
                    checked={selectedRows.includes(row.id)}
                    onCheckedChange={() => toggleRowSelection(row.id)}
                    onClick={e => e.stopPropagation()}
                  />
                </TableCell>
                <TableCell>{String((currentPage - 1) * itemsPerPage + index + 1).padStart(3, "0")}</TableCell>
                <TableCell>{row.ipBusinessName}</TableCell>
                <TableCell>{row.suBusinessName}</TableCell>
                {userRole === "ROLE_ADMIN" && <TableCell>{row.writer}</TableCell>}
                <TableCell>{formatDate(row.createAt)}</TableCell>
                <TableCell
                  className="text-gray-300 underline cursor-pointer"
                  onClick={e => {
                    e.stopPropagation();
                    openPreview(row.imageUrl);
                  }}>
                  {TruncateFileName(row.imageUrl)}
                </TableCell>
                <TableCell className="flex justify-center">
                  <Badge
                    custom={
                      ["APPROVED", "REJECTED", "UNAPPROVED"].includes(row.status)
                        ? (row.status as "APPROVED" | "REJECTED" | "UNAPPROVED")
                        : undefined
                    }>
                    {getStatusLabel(row.status as "APPROVED" | "REJECTED" | "UNAPPROVED")}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                <div className="flex flex-col items-center pt-[100px] pb-[130px] gap-7">
                  <img className="w-[80px]" src="/icon/noResult.svg" alt="검색결과 없음" />
                  <p className="text-body-sm text-gray-300">업로드된 세금계산서 파일이 없습니다.</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* 모달 */}
      <ApprovalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        index={selectedIndex}
        rowId={selectedRowId}
      />
      <StepProvider>
        <EditApprovalModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          index={selectedIndex}
          rowId={selectedRowId}
          dataTableFetch={fetchData}
        />
      </StepProvider>
      <PreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} fileUrl={previewUrl!} />

      {/* 페이지네이션 */}
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} />
          </PaginationItem>
          {Array.from({ length: totalPages }, (_, i) => (
            <PaginationItem key={i}>
              <button
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded-[2px] hover:bg-gray-50 ${currentPage === i + 1 ? "bg-green-50 text-green-500" : "text-gray-300"}`}>
                {i + 1}
              </button>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
