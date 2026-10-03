import fs from "node:fs";
import path from "node:path";
const root=path.resolve("android/app/src/main");
const javaDir=path.join(root,"java/com/siwraaj/shiwise");
const res=path.join(root,"res");
const values=path.join(res,"values"), xml=path.join(res,"xml"), layout=path.join(res,"layout"), drawable=path.join(res,"drawable");
for(const d of [javaDir,values,xml,layout,drawable]) fs.mkdirSync(d,{recursive:true});
const iconSource=path.resolve("../frontend/public/assets/1790986439376.png");
const iconTarget=path.join(res,"drawable-nodpi","shiwise_icon.png");
fs.mkdirSync(path.dirname(iconTarget),{recursive:true});
if(fs.existsSync(iconSource)) fs.copyFileSync(iconSource,iconTarget);
const javaFiles={
"ShiWiseWidgetBase.java":`package com.siwraaj.shiwise;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import org.json.JSONObject;
import java.util.Locale;
public abstract class ShiWiseWidgetBase extends AppWidgetProvider{
 protected abstract int layoutId();
 protected abstract void bind(RemoteViews v,JSONObject d);
 protected static String money(double n){return String.format(Locale.US,"₹%,.2f",n);}
 protected JSONObject snapshot(Context c){try{SharedPreferences p=c.getSharedPreferences("CapacitorStorage",Context.MODE_PRIVATE);return new JSONObject(p.getString("widget_snapshot","{}"));}catch(Exception e){return new JSONObject();}}
 @Override public void onUpdate(Context c,AppWidgetManager m,int[] ids){for(int id:ids){RemoteViews v=new RemoteViews(c.getPackageName(),layoutId());try{bind(v,snapshot(c));}catch(Exception ignored){} Intent i=new Intent(c,MainActivity.class);int requestCode=0;if(this instanceof QuickAddWidgetProvider){i.setData(Uri.parse("shiwise://quick-add"));i.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);requestCode=1001;}else{requestCode=1000;}i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TOP);PendingIntent pi=PendingIntent.getActivity(c,requestCode,i,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);v.setOnClickPendingIntent(R.id.widget_root,pi);m.updateAppWidget(id,v);}}
 public static void refreshAll(Context c){AppWidgetManager m=AppWidgetManager.getInstance(c);Class<?>[] p={BalanceWidgetProvider.class,GroupsWidgetProvider.class,RecentExpensesWidgetProvider.class,TripWidgetProvider.class,QuickAddWidgetProvider.class};for(Class<?> x:p){ComponentName n=new ComponentName(c,x);int[] ids=m.getAppWidgetIds(n);if(ids.length>0)c.sendBroadcast(new Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE).setComponent(n).putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS,ids));}}
}`,
"BalanceWidgetProvider.java":`package com.siwraaj.shiwise;
import android.widget.RemoteViews;
import org.json.JSONObject;
public class BalanceWidgetProvider extends ShiWiseWidgetBase{protected int layoutId(){return R.layout.widget_balance;}protected void bind(RemoteViews v,JSONObject d){double b=d.optDouble("balance",0);v.setTextViewText(R.id.widget_title,"Your balance");v.setTextViewText(R.id.widget_value,b>=0.005?"You are owed "+money(b):b<=-0.005?"You owe "+money(-b):"All settled");v.setTextViewText(R.id.widget_subtitle,"Tap to open ShiWise");}}
`,
"GroupsWidgetProvider.java":`package com.siwraaj.shiwise;
import android.widget.RemoteViews;
import org.json.JSONArray;
import org.json.JSONObject;
public class GroupsWidgetProvider extends ShiWiseWidgetBase{protected int layoutId(){return R.layout.widget_groups;}protected void bind(RemoteViews v,JSONObject d){v.setTextViewText(R.id.widget_title,"Groups");JSONArray a=d.optJSONArray("groups");StringBuilder s=new StringBuilder();if(a!=null)for(int i=0;i<Math.min(4,a.length());i++){JSONObject g=a.optJSONObject(i);if(g!=null)s.append(g.optString("name","Group")).append("  ").append(money(g.optDouble("total",0))).append("\\n");}if(s.length()==0)s.append("No groups yet");v.setTextViewText(R.id.widget_value,s.toString().trim());v.setTextViewText(R.id.widget_subtitle,"Group expense totals");}}
`,
"RecentExpensesWidgetProvider.java":`package com.siwraaj.shiwise;
import android.widget.RemoteViews;
import org.json.JSONArray;
import org.json.JSONObject;
public class RecentExpensesWidgetProvider extends ShiWiseWidgetBase{protected int layoutId(){return R.layout.widget_recent;}protected void bind(RemoteViews v,JSONObject d){v.setTextViewText(R.id.widget_title,"Recent expenses");JSONArray a=d.optJSONArray("recent");StringBuilder s=new StringBuilder();if(a!=null)for(int i=0;i<Math.min(4,a.length());i++){JSONObject e=a.optJSONObject(i);if(e!=null)s.append(e.optString("title","Expense")).append("  ").append(money(e.optDouble("amount",0))).append("\\n");}if(s.length()==0)s.append("No expenses yet");v.setTextViewText(R.id.widget_value,s.toString().trim());v.setTextViewText(R.id.widget_subtitle,"Latest expenses");}}
`,
"TripWidgetProvider.java":`package com.siwraaj.shiwise;
import android.widget.RemoteViews;
import org.json.JSONObject;
public class TripWidgetProvider extends ShiWiseWidgetBase{protected int layoutId(){return R.layout.widget_trip;}protected void bind(RemoteViews v,JSONObject d){JSONObject t=d.optJSONObject("trip");v.setTextViewText(R.id.widget_title,t==null?"Trip summary":t.optString("name","Trip summary"));v.setTextViewText(R.id.widget_value,t==null?"No trip data":money(t.optDouble("total",0)));v.setTextViewText(R.id.widget_subtitle,(t==null?0:t.optInt("expenses",0))+" expenses");}}
`,
"QuickAddWidgetProvider.java":`package com.siwraaj.shiwise;
import android.widget.RemoteViews;
import org.json.JSONObject;
public class QuickAddWidgetProvider extends ShiWiseWidgetBase{protected int layoutId(){return R.layout.widget_quick_add;}protected void bind(RemoteViews v,JSONObject d){v.setTextViewText(R.id.widget_title,"Quick add");v.setTextViewText(R.id.widget_value,"＋ Add expense");v.setTextViewText(R.id.widget_subtitle,"Open ShiWise");}}
`
};
for(const [n,c] of Object.entries(javaFiles))fs.writeFileSync(path.join(javaDir,n),c);
const layouts={balance:"Your balance",groups:"Groups",recent:"Recent expenses",trip:"Trip summary",quick_add:"Quick add"}; const widgetLabels={balance:"ShiWise Balance",groups:"ShiWise Groups",recent:"ShiWise Recent Expenses",trip:"ShiWise Trip Summary",quick_add:"ShiWise Quick Add"};
for(const n of Object.keys(layouts)){const value="wrap_content";fs.writeFileSync(path.join(layout,"widget_"+n+".xml"),'<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android" android:id="@+id/widget_root" android:layout_width="match_parent" android:layout_height="match_parent" android:orientation="vertical" android:padding="16dp" android:background="@drawable/widget_bg"><TextView android:id="@+id/widget_title" android:layout_width="match_parent" android:layout_height="wrap_content" android:textSize="14sp" android:textStyle="bold"/><TextView android:id="@+id/widget_value" android:layout_width="match_parent" android:layout_height="'+value+'"'+(value==="0dp"?' android:layout_weight="1"':'')+' android:layout_marginTop="8dp" android:textSize="'+(n==="trip"||n==="quick_add"?"20sp":"14sp")+'" android:textStyle="bold"/><TextView android:id="@+id/widget_subtitle" android:layout_width="match_parent" android:layout_height="wrap_content" android:layout_marginTop="6dp" android:textSize="10sp"/></LinearLayout>');}
fs.writeFileSync(path.join(drawable,"widget_bg.xml"),'<shape xmlns:android="http://schemas.android.com/apk/res/android"><corners android:radius="20dp"/><solid android:color="#FFFFFFFF"/><stroke android:width="1dp" android:color="#FFE4EBE7"/></shape>');
for(const n of Object.keys(layouts))fs.writeFileSync(path.join(xml,"widget_"+n+"_info.xml"),'<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android" android:minWidth="180dp" android:minHeight="100dp" android:updatePeriodMillis="0" android:initialLayout="@layout/widget_'+n+'" android:resizeMode="horizontal|vertical" android:widgetCategory="home_screen" android:label="@string/widget_'+n+'_label"/>');
const strings=path.join(values,"strings.xml");let sc=fs.existsSync(strings)?fs.readFileSync(strings,"utf8"):"<resources></resources>";if(!sc.includes("splitwise_widget_name"))sc=sc.replace("</resources>",'<string name="splitwise_widget_name">ShiWise</string></resources>');for(const [k,label] of Object.entries(widgetLabels)){const key="widget_"+k+"_label";if(!sc.includes(key))sc=sc.replace("</resources>",`<string name="${key}">${label}</string></resources>`);}fs.writeFileSync(strings,sc);
const manifestPath=path.join(root,"AndroidManifest.xml");let manifest=fs.readFileSync(manifestPath,"utf8");manifest=manifest.replace(/android:icon="@mipmap\/ic_launcher"/,'android:icon="@drawable/shiwise_icon"');const receivers=[["BalanceWidgetProvider","balance"],["GroupsWidgetProvider","groups"],["RecentExpensesWidgetProvider","recent"],["TripWidgetProvider","trip"],["QuickAddWidgetProvider","quick_add"]].map(x=>'<receiver android:name=".'+x[0]+'" android:label="@string/widget_'+x[1]+'_label" android:exported="true"><intent-filter><action android:name="android.appwidget.action.APPWIDGET_UPDATE"/></intent-filter><meta-data android:name="android.appwidget.provider" android:resource="@xml/widget_'+x[1]+'_info"/></receiver>').join("");if(!manifest.includes("BalanceWidgetProvider"))manifest=manifest.replace("</application>",receivers+"</application>");if(!manifest.includes("shiwise://quick-add")){const deepLink='<intent-filter><action android:name="android.intent.action.VIEW"/><category android:name="android.intent.category.DEFAULT"/><category android:name="android.intent.category.BROWSABLE"/><data android:scheme="shiwise" android:host="quick-add"/></intent-filter>';const marker='android:name=".MainActivity"';const pos=manifest.indexOf(marker);if(pos>=0){const open=manifest.indexOf(">",pos);if(open>=0)manifest=manifest.slice(0,open+1)+deepLink+manifest.slice(open+1);}}fs.writeFileSync(manifestPath,manifest);
console.log("Android widgets installed");
