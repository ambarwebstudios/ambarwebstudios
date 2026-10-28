<?php
session_start();
require __DIR__.'/config.php';

$G=['genero','id_genero','nombre_genero']; $B=['barrio','Id_Barrio','Nombre_Barrio'];
$C=['civil','id_civil','estado'];          $E=['especialidad','id_esp','nombre_esp'];
$Z=['zona','Id_Zona','Nombre_Zona'];

function persona($n){ global $G,$B,$C;
  [$ap,$no,$dn,$fc,$ge,$te,$ma,$ca,$nu,$pi,$de,$ed,$ba,$ci]=$n;
  return [$ap=>['Apellido','text',1],$no=>['Nombre','text',1],$dn=>['DNI','number',1],$fc=>['Nacimiento','date',0],
  $ge=>['Género','fk',1,$G],$te=>['Teléfono','tel',0],$ma=>['Email','email',1],$ca=>['Calle','text',0],
  $nu=>['Número','number',0],$pi=>['Piso','text',0],$de=>['Depto','text',0],$ed=>['Edificio','text',0],
  $ba=>['Barrio','fk',1,$B],$ci=>['Estado civil','fk',0,$C]];
}
$T=[
 'alumno'=>['l'=>'Alumnos','s'=>'alumno','i'=>'🎓','pk'=>'Id_Alumno','c'=>persona(['Apellido_Alumno','Nombre_Alumno','Documento_Alumno','FecNac','GENERO_ALUMNO','Telefono_Alumno','Mail_Alumno','Calle_Alumno','Numero_Alumno','Piso_Alumno','Depto_Alumno','Edificio_Alumno','Barrio_Alumno','CIVIL_Alumno'])],
 'profesores'=>['l'=>'Profesores','s'=>'profesor','i'=>'🧑‍🏫','pk'=>'Id_prof','c'=>persona(['Apellido_prof','Nombre_prof','Documento_prof','FecNac_prof','GENERO_prof','Telefono_prof','Mail_prof','Calle_prof','Numero_prof','Piso_prof','Depto_prof','Edificio_prof','BARRIO_prof','CIVIL_prof'])],
 'materias'=>['l'=>'Materias','s'=>'materia','i'=>'📚','pk'=>'id_materia','c'=>['nombre_materia'=>['Materia','text',1],'ESPECIALIDAD_MATERIA'=>['Especialidad','fk',1,$E]]],
 'cursos'=>['l'=>'Cursos','s'=>'curso','i'=>'🏫','pk'=>'id_curso','c'=>['nombre_curso'=>['Curso','text',1],'esp_curso'=>['Especialidad','fk',1,$E]]],
 'aulas'=>['l'=>'Aulas','s'=>'aula','i'=>'🚪','pk'=>'id_aula','c'=>['num_aula'=>['Aula','text',1],'tipo_aula'=>['Tipo','text',1],'capacidad_aula'=>['Capacidad','number',1]]],
 'barrio'=>['l'=>'Barrios','s'=>'barrio','i'=>'📍','pk'=>'Id_Barrio','c'=>['Nombre_Barrio'=>['Barrio','text',1],'ZONAS_BARRIO'=>['Zona','fk',1,$Z]]],
];

function db(){ global $DB_HOST,$DB_NAME,$DB_USER,$DB_PASS; static $p;
  return $p ??= new PDO("mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4",$DB_USER,$DB_PASS,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]); }
function maxlens(){ $o=[]; try{ foreach(db()->query("SELECT TABLE_NAME t,COLUMN_NAME c,CHARACTER_MAXIMUM_LENGTH m FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE()") as $r) if($r['m']) $o[$r['t']][$r['c']]=(int)$r['m']; }catch(Throwable $e){} return $o; }

$auth = $PANEL_PASS==='' || !empty($_SESSION['ok']);
if(isset($_GET['salir'])){ session_destroy(); header('Location: ./'); exit; }
$bad=false;
if(!$auth && isset($_POST['clave'])){ if(hash_equals($PANEL_PASS,$_POST['clave'])){ $_SESSION['ok']=1; header('Location: ./'); exit; } $bad=true; }

if(isset($_GET['api'])){
  header('Content-Type: application/json; charset=utf-8');
  if(!$auth){ http_response_code(401); echo '{"error":"Sesión vencida"}'; exit; }
  try{
    $a=$_GET['api']; $tb=$_GET['t']??''; $in=json_decode(file_get_contents('php://input'),true)??[];
    if($a==='meta'){
      $L=maxlens(); $o=['order'=>array_keys($T),'tables'=>[],'opts'=>[],'counts'=>[]];
      foreach($T as $k=>$t){ $cols=[];
        foreach($t['c'] as $n=>$d){ $cols[]=['n'=>$n,'l'=>$d[0],'t'=>$d[1],'s'=>$d[2],'fk'=>$d[3][0]??null,'max'=>$L[$k][$n]??null];
          if(!empty($d[3]) && !isset($o['opts'][$d[3][0]])){ [$ft,$fi,$fl]=$d[3]; $o['opts'][$ft]=array_map('array_values',db()->query("SELECT `$fi`,`$fl` FROM `$ft` ORDER BY `$fl`")->fetchAll()); } }
        $o['tables'][$k]=['l'=>$t['l'],'s'=>$t['s'],'i'=>$t['i'],'pk'=>$t['pk'],'cols'=>$cols];
        $o['counts'][$k]=(int)db()->query("SELECT COUNT(*) FROM `$k`")->fetchColumn(); }
      echo json_encode($o,JSON_INVALID_UTF8_SUBSTITUTE); exit;
    }
    if(!isset($T[$tb])) throw new RuntimeException('Tabla desconocida');
    $pk=$T[$tb]['pk']; $def=$T[$tb]['c'];
    if($a==='list'){ echo json_encode(['rows'=>db()->query("SELECT * FROM `$tb` ORDER BY `$pk` DESC")->fetchAll()],JSON_INVALID_UTF8_SUBSTITUTE); }
    elseif($a==='save'){
      $d=$in['data']??[]; $id=(int)($in['id']??0); $v=[]; $L=maxlens();
      foreach($def as $c=>$k){ $x=$d[$c]??'';
        if($k[1]==='number'||$k[1]==='fk') $x=(int)$x;
        elseif($k[1]==='tel') $x=preg_replace('/\D/','',(string)$x)?:'0';
        elseif($k[1]==='date'){ if(!preg_match('/^\d{4}-\d{2}-\d{2}$/',(string)$x)) throw new RuntimeException("Completá la fecha de «{$k[0]}»."); }
        else{ $x=trim((string)$x); if(isset($L[$tb][$c])) $x=mb_substr($x,0,$L[$tb][$c]); }
        $v[$c]=$x; }
      if($id){ db()->prepare("UPDATE `$tb` SET ".implode(',',array_map(fn($c)=>"`$c`=?",array_keys($v)))." WHERE `$pk`=?")->execute([...array_values($v),$id]); }
      else{ db()->prepare("INSERT INTO `$tb` (".implode(',',array_map(fn($c)=>"`$c`",array_keys($v))).") VALUES (".implode(',',array_fill(0,count($v),'?')).")")->execute(array_values($v)); $id=(int)db()->lastInsertId(); }
      echo json_encode(['id'=>$id]);
    }
    elseif($a==='delete'){ db()->prepare("DELETE FROM `$tb` WHERE `$pk`=?")->execute([(int)($in['id']??0)]); echo '{"ok":1}'; }
    else throw new RuntimeException('Acción desconocida');
  }catch(Throwable $e){ http_response_code(400); echo json_encode(['error'=>$e instanceof PDOException?'Error de base de datos. Revisá config.php.':$e->getMessage()]); }
  exit;
}
?><!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Escuela · Panel de gestión</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;800&family=Figtree:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css"></head><body>
<div class="orbs"><i></i><i></i><i></i></div>
<?php if(!$auth): ?>
<form class="login sheet" method="post"><h1>Escuela</h1><p>Ingresá la contraseña para abrir el panel.</p>
<input type="password" name="clave" placeholder="Contraseña" autofocus required>
<?php if($bad): ?><p class="err">Contraseña incorrecta. Probá de nuevo.</p><?php endif; ?>
<button class="btn">Entrar</button></form>
<?php else: ?>
<div class="app">
 <aside><div class="brand">Escuela<span>Panel de gestión</span></div><nav id="nav"></nav>
 <?php if($PANEL_PASS!==''): ?><a class="out" href="?salir">Cerrar sesión</a><?php endif; ?></aside>
 <main><header><div><h1 id="ttl">&nbsp;</h1><p id="sub"></p></div>
  <div class="tools"><input id="q" type="search" placeholder="Buscar en esta lista" autocomplete="off"><button id="new" class="btn">+ Agregar</button></div></header>
  <div class="card"><div class="tw"><table id="tb"></table></div></div></main>
</div>
<dialog id="dlg"><form id="form" class="sheet"><h2 id="ft"></h2><div class="fg" id="fields"></div>
 <div class="row"><button type="button" class="btn ghost" data-close>Cancelar</button><button class="btn" id="sv">Guardar</button></div></form></dialog>
<dialog id="cfm"><div class="sheet sm"><h2>¿Eliminar este registro?</h2><p><b id="cn"></b> se va a borrar y no se puede deshacer.</p>
 <div class="row"><button type="button" class="btn ghost" data-close>Cancelar</button><button class="btn red" id="yes">Eliminar</button></div></div></dialog>
<div id="toasts"></div><script src="app.js"></script>
<?php endif; ?></body></html>