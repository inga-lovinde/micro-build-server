import * as ReportTypes from "./report-types";
import * as TaskProcessorTypes from "./task-processor-types";

export type Message = ReportTypes.IMessage;
export type Messages = ReportTypes.Messages;
export type MessagesRoot = ReportTypes.MessagesRoot;
export type Report = ReportTypes.IReport;
export type ReportResult = ReportTypes.IReportResult;

export type Task = TaskProcessorTypes.Task;
export type TaskInfo = TaskProcessorTypes.ITaskInfo;
export type TaskProcessor = TaskProcessorTypes.ITaskProcessor;
export type TaskProcessorCallback = TaskProcessorTypes.TaskProcessorCallback;
export type TaskProcessorCore = TaskProcessorTypes.ITaskProcessorCore;
export type Tasks = TaskProcessorTypes.ITasks;
