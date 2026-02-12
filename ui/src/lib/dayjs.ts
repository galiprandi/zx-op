import DayJs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import es from "dayjs/locale/es";

DayJs.extend(relativeTime);
DayJs.locale(es);

export default DayJs;