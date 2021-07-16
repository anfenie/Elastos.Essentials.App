
import { Injectable } from '@angular/core';

@Injectable()
export class Util {
    public static uuid(len, radix): string {
        var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
        var uuid = [], i;
        radix = radix || chars.length;

        if (len) {
            // Compact form
            for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
        } else {
            // rfc4122, version 4 form
            var r;

            // rfc4122 requires these characters
            uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
            uuid[14] = '4';

            // Fill in random data. At i==19 set the high bits of clock sequence as
            // per rfc4122, sec. 4.1.5
            for (i = 0; i < 36; i++) {
                if (!uuid[i]) {
                    r = 0 | Math.random() * 16;
                    uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
                }
            }
        }

        return uuid.join('');
    }

    // TODO: not enough for other western languages like french.
    static english(text): boolean {
        var pattern = new RegExp("[A-Za-z]+");
        return pattern.test(text);
    };

    static chinese(text): boolean {
        var pattern = new RegExp("[\u4E00-\u9FA5]+");
        return pattern.test(text);
    };

    static japanese(text): boolean {
        var pattern = new RegExp("[\u0800-\u4e00]+");
        return pattern.test(text);
    };

    public static isEmptyObject(obj): boolean {
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                return false;
            }
        }
        return true;
    }

    public static isNull(data): boolean {
        return (data === '' || data === undefined || data === null) ? true : false;
    }

    public static clone(Obj) {
        if (typeof (Obj) != 'object') return Obj;
        if (Obj == null) return Obj;

        let newObj;

        if (Obj instanceof (Array)) {
            newObj = new Array();
        } else {
            newObj = new Object();
        }

        for (let i in Obj)
            newObj[i] = this.clone(Obj[i]);

        return newObj;
    }

    public static didStringToDir(didString: string): string {
        return didString.replace(/:/g, "_");
    }

    public static reverseHexToBE(digest: string): string {
        let buf = Buffer.from(digest, "hex");
        return buf.reverse().toString("hex");
    }

    public static accMul(arg1, arg2) {
        let m = 0, s1 = arg1.toString(), s2 = arg2.toString();
        try { m += s1.split(".")[1].length } catch (e) { }
        try { m += s2.split(".")[1].length } catch (e) { }

        return Math.floor(Number(s1.replace(".", "")) * Number(s2.replace(".", "")) / Math.pow(10, m))
    }

    public static timestampToDateTime(timestamp = Date.now(), format = 'yyyy-MM-dd HH:mm:ss') {
        if (isNaN(timestamp)) {
            return '';
        }

       if (format.length < 4 || 'yyyy-MM-dd HH:mm:ss'.indexOf(format) !== 0) {
            return '';
        }

        const date = new Date(Number(timestamp));

        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hour = date.getHours();
        const minute = date.getMinutes();
        const second = date.getSeconds();

        return format.replace('yyyy', year.toString())
            .replace('MM', month > 9 ? month.toString() : `0${month}`)
            .replace('dd', day > 9 ? day.toString() : `0${day}`)
            .replace('HH', hour > 9 ? hour.toString() :`0${hour}`)
            .replace('mm', minute > 9 ? minute.toString() : `0${minute}`)
            .replace('ss', second > 9 ? second.toString() : `0${second}`);
    }

}
